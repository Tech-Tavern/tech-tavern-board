import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import List from "./List";

export default function Board({ boardId, data, setData, updateListColor }) {
  const board = data.boards[boardId];

  const handleAddList = (afterListId) => {
    const newListId = `list-${Date.now()}`;
    const newList = {
      id: newListId,
      boardId,
      title: "New List",
      color: "#FFFFFF",
      position: 0,
      cardIds: [],
      createdBy: "uid_CURRENT_USER",
      updatedBy: "uid_CURRENT_USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((prev) => {
      const b = prev.boards[boardId];
      const newLists = { ...prev.lists, [newListId]: newList };
      let boardPatch = {};

      if (b.columns) {
        const colIds = b.columnOrder || Object.keys(b.columns);
        const columnId =
          colIds.find((cid) => b.columns[cid].listIds.includes(afterListId)) ||
          colIds[0];

        const oldIds = b.columns[columnId].listIds;
        const idx = oldIds.indexOf(afterListId);
        const newIds = [
          ...oldIds.slice(0, idx + 1),
          newListId,
          ...oldIds.slice(idx + 1),
        ];

        boardPatch.columns = {
          ...b.columns,
          [columnId]: { ...b.columns[columnId], listIds: newIds },
        };
      } else {
        boardPatch.listIds = [...(b.listIds || []), newListId];
      }

      return {
        ...prev,
        lists: newLists,
        boards: {
          ...prev.boards,
          [boardId]: { ...b, ...boardPatch },
        },
      };
    });
  };

  const handleRenameList = (listId, newTitle) => {
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

  const onDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;

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

      setData((prev) => {
        const b = prev.boards[boardId];
        const order = b.columnOrder ?? ["col-default"];
        const columns = b.columns ?? {
          "col-default": {
            id: "col-default",
            listIds: b.listIds ?? [],
          },
        };

        const nextOrder = [...order];
        const nextCols = { ...columns };

        if (toCol === "__new_column__") {
          const newCol = `col-${Date.now()}`;
          nextOrder.push(newCol);
          nextCols[newCol] = { id: newCol, listIds: [listId] };
          // Remove from original
          nextCols[fromCol] = {
            ...nextCols[fromCol],
            listIds: nextCols[fromCol].listIds.filter((id) => id !== listId),
          };
        } else {
          // Remove from source
          nextCols[fromCol] = {
            ...nextCols[fromCol],
            listIds: nextCols[fromCol].listIds.filter((id) => id !== listId),
          };
          // Insert into destination
          const destIds = Array.from(nextCols[toCol].listIds);
          destIds.splice(destination.index, 0, listId);
          nextCols[toCol] = { ...nextCols[toCol], listIds: destIds };
        }

        return {
          ...prev,
          boards: {
            ...prev.boards,
            [boardId]: { ...b, columns: nextCols, columnOrder: nextOrder },
          },
        };
      });
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
                  {(dragProv) => (
                    <div
                      ref={dragProv.innerRef}
                      {...dragProv.draggableProps}
                      {...dragProv.dragHandleProps}
                      className="mb-4"
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
