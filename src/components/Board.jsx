import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import List from "./List";
import { createList, updateList } from "../api/lists";
import { useAuth } from "../authContext";

export default function Board({ boardId, data, setData, updateListColor }) {
  const board = data.boards[boardId];
  console.log("Board data:", board);
  const { user } = useAuth();

  const handleAddList = async (afterListId) => {
    const afterList = data.lists[afterListId];
    if (!afterList) {
      console.error("Invalid afterListId:", afterListId);
      return;
    }
    const tempId = `temp-${Date.now()}`;
    const tempList = {
      id: tempId,
      boardId,
      title: "New List",
      color: "#FFFFFF",
      position: 0,
      columnPos: 0,
      cardIds: [],
    };

    // 2) update state optimistically
    setData((prev) => {
      const b = prev.boards[boardId];

      // always inject the new list object
      const newLists = { ...prev.lists, [tempId]: tempList };

      // decide how to patch the board
      let boardPatch;
      if (b.columns) {
        // multi-column mode
        // find which column the "after" list is in
        const colId = b.columnOrder.find((cid) =>
          b.columns[cid].listIds.includes(afterListId)
        );
        const oldIds = b.columns[colId].listIds;
        const idx = oldIds.indexOf(afterListId);

        // insert new tempId into that column’s listIds
        const newCols = {
          ...b.columns,
          [colId]: {
            ...b.columns[colId],
            listIds: [
              ...oldIds.slice(0, idx + 1),
              tempId,
              ...oldIds.slice(idx + 1),
            ],
          },
        };

        boardPatch = {
          columns: newCols,
          columnOrder: b.columnOrder,
        };
      } else {
        boardPatch = {
          listIds: [...(b.listIds || []), tempId],
        };
      }

      return {
        ...prev,
        lists: newLists,
        boards: {
          ...prev.boards,
          [boardId]: {
            ...b,
            ...boardPatch,
          },
        },
      };
    });

    // 3) send to server, then replace tempId with real id
    try {
      const saved = await createList(
        boardId,
        {
          title: tempList.title,
          position: tempList.position,
          color: tempList.color,
        },
        user.uid
      );

      setData((prev) => {
        // remove temp
        const { [tempId]: _, ...rest } = prev.lists;
        // inject real
        const updatedLists = { ...rest, [saved.id]: { ...saved, cardIds: [] } };

        // swap IDs in whichever ordering array is active
        const b = prev.boards[boardId];
        let newBoard;
        if (b.columns) {
          // multi-column: map through each column’s listIds
          const newCols = {};
          for (const cid of b.columnOrder) {
            newCols[cid] = {
              ...b.columns[cid],
              listIds: b.columns[cid].listIds.map((id) =>
                id === tempId ? String(saved.id) : id
              ),
            };
          }
          newBoard = { ...b, columns: newCols, columnOrder: b.columnOrder };
        } else {
          // single-column
          newBoard = {
            ...b,
            listIds: b.listIds.map((id) =>
              id === tempId ? String(saved.id) : id
            ),
          };
        }

        return {
          ...prev,
          lists: updatedLists,
          boards: {
            ...prev.boards,
            [boardId]: newBoard,
          },
        };
      });
    } catch (err) {
      console.error("Failed to create list:", err);
      // optionally roll back the optimistic update
    }
  };

  const handleRenameList = async (listId, newTitle) => {
    setData((prev) => ({
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
      await updateList(boardId, listId, { title: newTitle });
    } catch (err) {
      console.error("Failed to rename list:", err);
    }
  };

  const handleDeleteList = (listId) => {
    setData((prev) => {
      const b = prev.boards[boardId];
      const { [listId]: _, ...remainingLists } = prev.lists;
      const newListIds = (b.listIds ?? []).filter((id) => id !== listId);

      let newColumns = b.columns;
      let newColumnOrder = b.columnOrder;
      if (b.columns) {
        const colsEntries = Object.entries(b.columns)
          .map(([colId, col]) => {
            const filtered = col.listIds.filter((id) => id !== listId);
            return [colId, { ...col, listIds: filtered }];
          })
          .filter(([, col]) => col.listIds.length > 0);

        newColumns = Object.fromEntries(colsEntries);
        newColumnOrder = (b.columnOrder ?? []).filter(
          (colId) => newColumns[colId]
        );
      }

      return {
        ...prev,
        lists: remainingLists,
        boards: {
          ...prev.boards,
          [boardId]: {
            ...b,
            listIds: newListIds,
            ...(b.columns && {
              columns: newColumns,
              columnOrder: newColumnOrder,
            }),
          },
        },
      };
    });
  };

  const handleRenameCard = (cardId, newContent) => {
    setData((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [cardId]: {
          ...prev.cards[cardId],
          content: newContent,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const handleAddCard = (listId, text) => {
    const newCardId = `card-${Date.now()}`;
    const newCard = {
      id: newCardId,
      listId,
      content: text,
      description: "",
      color: "default",
      position: data.lists[listId].cardIds.length,
      completed: false,
      archived: false,
      createdBy: "uid_CURRENT_USER",
      updatedBy: "uid_CURRENT_USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [newCardId]: newCard,
      },
      lists: {
        ...prev.lists,
        [listId]: {
          ...prev.lists[listId],
          cardIds: [...prev.lists[listId].cardIds, newCardId],
        },
      },
    }));
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;

    if (type === "LIST" && destination.droppableId === "__new_column__") {
      const currentCols = board.columnOrder || [];
      const newIndex = currentCols.length;
      const newColId = `col-${newIndex}`;

      setData((prev) => {
        const b = prev.boards[boardId];
        const newCols = {
          ...b.columns,
          [newColId]: { id: newColId, listIds: [] },
        };
        const newOrder = [...(b.columnOrder || []), newColId];

        // Remove from old column
        const fromCols = { ...newCols };
        const srcListIds = [...fromCols[source.droppableId].listIds];
        srcListIds.splice(source.index, 1);
        fromCols[source.droppableId] = {
          ...fromCols[source.droppableId],
          listIds: srcListIds,
        };

        // Add to new column
        const tgtListIds = [
          ...fromCols[newColId].listIds,
          draggableId.replace(/^list-/, ""),
        ];
        fromCols[newColId] = { ...fromCols[newColId], listIds: tgtListIds };

        return {
          ...prev,
          boards: {
            ...prev.boards,
            [boardId]: {
              ...b,
              columns: fromCols,
              columnOrder: newOrder,
            },
          },
        };
      });

      const listId = Number(draggableId.replace(/^list-/, ""));
      try {
        await updateList(boardId, listId, { columnPos: newIndex });
      } catch (err) {
        console.error("Failed to update list columnPos:", err);
      }

      return;
    }

    if (type === "CARD") {
      const srcListId = source.droppableId.replace(/^list-/, "");
      const dstListId = destination.droppableId.replace(/^list-/, "");
      const cardId = draggableId.replace(/^card-/, "");

      setData((prev) => {
        const start = prev.lists[srcListId];
        const finish = prev.lists[dstListId];

        if (start === finish) {
          const ids = Array.from(start.cardIds);
          ids.splice(source.index, 1);
          ids.splice(destination.index, 0, cardId);
          return {
            ...prev,
            lists: { ...prev.lists, [start.id]: { ...start, cardIds: ids } },
          };
        }

        const startIds = Array.from(start.cardIds);
        startIds.splice(source.index, 1);
        const finishIds = Array.from(finish.cardIds);
        finishIds.splice(destination.index, 0, cardId);

        return {
          ...prev,
          lists: {
            ...prev.lists,
            [start.id]: { ...start, cardIds: startIds },
            [finish.id]: { ...finish, cardIds: finishIds },
          },
        };
      });
      return;
    }

    if (type === "LIST") {
      const listId = draggableId.replace(/^list-/, "");
      const fromCol = source.droppableId;
      const toCol = destination.droppableId;

      let newCols;
      setData((prev) => {
        const prevBoard = prev.boards[boardId];

        // Deep copy columns
        newCols = {
          ...prevBoard.columns,
          [fromCol]: {
            ...prevBoard.columns[fromCol],
            listIds: [...prevBoard.columns[fromCol].listIds],
          },
          [toCol]: {
            ...prevBoard.columns[toCol],
            listIds: [...(prevBoard.columns[toCol]?.listIds || [])],
          },
        };

        // Remove from source
        newCols[fromCol].listIds.splice(source.index, 1);

        // Insert into destination
        newCols[toCol].listIds.splice(destination.index, 0, listId);

        return {
          ...prev,
          boards: {
            ...prev.boards,
            [boardId]: {
              ...prevBoard,
              columns: newCols,
            },
          },
        };
      });

      // Calculate new positions explicitly for backend sync
      const nextIds = newCols[toCol].listIds;
      const numeric = /^\d+$/;
      const payload = nextIds
        .filter((id) => numeric.test(id)) // skip temp ids
        .map((id, idx) => ({
          id: Number(id),
          position: idx,
          columnPos: Number(toCol.replace("col-", "")),
        }));

      try {
        await Promise.all(
          payload.map((list) =>
            updateList(boardId, list.id, {
              position: list.position,
              columnPos: list.columnPos,
            })
          )
        );
      } catch (err) {
        console.error("Failed to update list positions:", err);
      }
    }
  };

  const cols = board.columns ?? {
    "col-default": {
      id: "col-default",
      listIds: board.listIds ?? [],
    },
  };

  const renderColumn = (colId) => {
    const column = cols[colId];

    return (
      <Droppable
        key={colId}
        droppableId={colId}
        direction="vertical"
        type="LIST"
      >
        {(prov) => (
          <div
            ref={prov.innerRef}
            {...prov.droppableProps}
            className="min-w-[280px] p-4 flex flex-col"
          >
            <h2 className="font-bold mb-2">{column.title}</h2>

            {column.listIds.map((lid, idx) => {
              const list = data.lists[lid];
              const cards = list.cardIds.map((cid) => data.cards[cid]);
              return (
                <Draggable
                  key={`list-${lid}`}
                  draggableId={`list-${lid}`}
                  index={idx}
                >
                  {(dragProv, snapshot) => (
                    <div
                      ref={dragProv.innerRef}
                      {...dragProv.draggableProps}
                      {...dragProv.dragHandleProps}
                      className={
                        `mb-4 transition-opacity duration-150 ` +
                        (snapshot.isDragging
                          ? "opacity-75 cursor-grabbing"
                          : "opacity-100")
                      }
                    >
                      <List
                        list={list}
                        cards={cards}
                        updateListColor={updateListColor}
                        onAddList={handleAddList}
                        onRenameList={handleRenameList}
                        onDeleteList={handleDeleteList}
                        onAddCard={handleAddCard}
                        onRenameCard={handleRenameCard}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {prov.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <h1 className="bg-indigo-500 text-white pl-4 text-2xl font-bold py-4">
        {board.title}
      </h1>

      <div className="flex h-screen overflow-x-auto p-6 bg-gradient-to-tl from-[#1a1c2b] via-[#23263a] to-[#2d3250]">
        {(board.columnOrder ?? ["col-default"]).map(renderColumn)}

        {/* This droppable lets you create a new column by dragging a list here */}
        <Droppable
          droppableId="__new_column__"
          direction="vertical"
          type="LIST"
        >
          {(prov) => (
            <div
              ref={prov.innerRef}
              {...prov.droppableProps}
              className="min-w-[280px] flex-shrink-0 p-4 flex items-center justify-center text-gray-600"
            >
              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}
