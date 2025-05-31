import { useState, useCallback } from "react";
import { createListApi, deleteListApi, updateListApi } from "../api/lists";

export default function useListsHooks(boardId, dataState, setDataState) {
  const [isLoading] = useState(false);

  // Insert newItem in array immediately after referenceItem
  function insertAfter(array, referenceItem, newItem) {
    const index = array.indexOf(referenceItem);
    if (index === -1) return array.concat(newItem);
    return array
      .slice(0, index + 1)
      .concat(newItem)
      .concat(array.slice(index + 1));
  }

  const generateDefaultList = useCallback(
    () => ({
      id: `temp-${Date.now()}`,
      boardId,
      title: "New List",
      color: `#${Math.floor(Math.random() * 0x1000000)
        .toString(16)
        .padStart(6, "0")}`,
      position: 0,
      columnPos: 0,
      cardIds: [],
    }),
    [boardId]
  );

  const addList = useCallback(
    async (afterListId) => {
      // Compute insertion index and column
      const board = dataState.boards[boardId];
      if (!board) return;
      const { columns, columnOrder } = board;
      const targetCol = columnOrder.find((cid) =>
        columns[cid].listIds.includes(afterListId)
      );
      const existingIds = columns[targetCol].listIds;
      const insertPos = existingIds.indexOf(afterListId) + 1;
      const colIndex = columnOrder.indexOf(targetCol);

      // Generate temp list
      const tempId = `temp-${Date.now()}`;
      const tempColor = `#${Math.floor(Math.random() * 0x1000000)
        .toString(16)
        .padStart(6, "0")}`;
      const tempList = {
        id: tempId,
        boardId,
        title: "New List",
        color: tempColor,
        position: insertPos,
        columnPos: colIndex,
        cardIds: [],
      };

      // Optimistically insert and bump positions
      setDataState((prev) => {
        const newLists = { ...prev.lists, [tempId]: tempList };
        const b = prev.boards[boardId];
        if (!b) return prev;
        const newIds = insertAfter(
          b.columns[targetCol].listIds,
          afterListId,
          tempId
        );
        // bump positions
        newIds.forEach((id, idx) => {
          if (newLists[id]) newLists[id] = { ...newLists[id], position: idx };
        });
        const newCols = {
          ...b.columns,
          [targetCol]: { ...b.columns[targetCol], listIds: newIds },
        };
        const newBoard = { ...b, columns: newCols };
        return {
          ...prev,
          lists: newLists,
          boards: { ...prev.boards, [boardId]: newBoard },
        };
      });

      try {
        // Create the list on the server with intended position and column
        const created = await createListApi(boardId, {
          title: tempList.title,
          color: tempList.color,
          position: tempList.position,
          columnPos: tempList.columnPos,
        });
        // Build the final ordering for this column
        const finalIds = insertAfter(
          board.columns[targetCol].listIds,
          afterListId,
          created.id
        );
        // Persist new ordering (positions) for all items in this column
        await Promise.all(
          finalIds.map((id, idx) =>
            updateListApi(boardId, id, { position: idx, columnPos: colIndex })
          )
        );
        // Reconcile local state from server
        setDataState((prev) => {
          const { [tempId]: removed, ...rest } = prev.lists;
          const updatedLists = { ...rest };
          const b = prev.boards[boardId];
          const reconciledCols = {
            ...b.columns,
            [targetCol]: { ...b.columns[targetCol], listIds: finalIds },
          };
          // update each list entry with server data & new position
          finalIds.forEach((id, idx) => {
            const listData = id === created.id ? created : prev.lists[id];
            updatedLists[id] = {
              ...listData,
              position: idx,
              columnPos: colIndex,
              cardIds: listData.cardIds || [],
            };
          });
          const reconciledBoard = { ...b, columns: reconciledCols };
          return {
            ...prev,
            lists: updatedLists,
            boards: { ...prev.boards, [boardId]: reconciledBoard },
          };
        });
      } catch (error) {
        console.error("Failed to persist list positions:", error);
      }
    },
    [boardId, dataState.boards, setDataState]
  );

  const renameList = useCallback(
    async (listId, newTitle) => {
      setDataState((prev) => ({
        ...prev,
        lists: {
          ...prev.lists,
          [listId]: {
            ...prev.lists[listId],
            title: newTitle,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
      try {
        await updateListApi(boardId, listId, { title: newTitle });
      } catch (err) {
        console.error("Failed to rename list:", err);
      }
    },
    [boardId, setDataState]
  );

  const removeList = useCallback(
    async (listId) => {
      try {
        await deleteListApi(boardId, listId);
        setDataState((prev) => {
          const lists = { ...prev.lists };
          delete lists[listId];
          const b = prev.boards[boardId];
          if (!b) return prev;
          const updatedCols = {};
          b.columnOrder.forEach((colId) => {
            const ids = b.columns[colId].listIds.filter((id) => id !== listId);
            // bump positions
            ids.forEach((id, idx) => {
              if (lists[id]) lists[id] = { ...lists[id], position: idx };
            });
            updatedCols[colId] = { ...b.columns[colId], listIds: ids };
          });
          const newBoard = { ...b, columns: updatedCols };
          return {
            ...prev,
            lists,
            boards: { ...prev.boards, [boardId]: newBoard },
          };
        });
      } catch (err) {
        console.error("Failed to delete list:", err);
      }
    },
    [boardId, setDataState]
  );

  return { isLoading, addList, renameList, removeList, generateDefaultList };
}
