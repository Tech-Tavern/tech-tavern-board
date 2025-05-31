import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import List from "./List";
import { useState } from "react";
import useListHooks from "../hooks/useListHooks";
import { updateListApi } from "../api/lists";

export default function Board({ boardId, data, setData, updateListColor }) {
  const board = data.boards[boardId];

  const { addList, renameList, removeList } = useListHooks(
    boardId,
    data,
    setData
  );

  const [isDraggingList, setIsDraggingList] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);

  const onDragEnd = async (result) => {
    setIsDraggingList(false);
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

        const fromCols = { ...newCols };
        const srcListIds = [...fromCols[source.droppableId].listIds];
        srcListIds.splice(source.index, 1);
        fromCols[source.droppableId] = {
          ...fromCols[source.droppableId],
          listIds: srcListIds,
        };

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
        await updateListApi(boardId, listId, { columnPos: newIndex });
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

        newCols[fromCol].listIds.splice(source.index, 1);

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

      const nextIds = newCols[toCol].listIds;
      const numeric = /^\d+$/;
      const payload = nextIds
        .filter((id) => numeric.test(id))
        .map((id, idx) => ({
          id: Number(id),
          position: idx,
          columnPos: Number(toCol.replace("col-", "")),
        }));

      try {
        await Promise.all(
          payload.map((list) =>
            updateListApi(boardId, list.id, {
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
        {(prov, snapshot) => (
          <div
            ref={prov.innerRef}
            {...prov.droppableProps}
            className={`
        min-w-[280px] p-4 flex flex-col
        transition-all duration-200
        ${
          snapshot.isDraggingOver
            ? "bg-white/10 ring-2 ring-indigo-400 ring-offset-2 rounded-lg"
            : "bg-transparent"
        }
      `}
          >
            <h2 className="font-bold mb-2">{column.title}</h2>

            {column.listIds.map((lid, idx) => {
              const list = data.lists[lid];
              const cards = list.cardIds.map((cid) => data.cards[cid]);
              const isSelected = selectedListId === lid;
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
                      onClick={() => setSelectedListId(lid)}
                      className={
                        `mb-4 transition-opacity duration-150 cursor-pointer ` +
                        (snapshot.isDragging
                          ? "opacity-75 cursor-grabbing"
                          : "opacity-100") +
                        (isSelected
                          ? " ring-4 ring-indigo-300 ring-offset-2 rounded-lg"
                          : "")
                      }
                    >
                      <List
                        boardId={boardId}
                        list={list}
                        cards={cards}
                        updateListColor={updateListColor}
                        onAddList={addList}
                        onRenameList={renameList}
                        onDeleteList={removeList}
                        data={data}
                        setData={setData}
                        // onAddCard={addCard}
                        // onRenameCard={renameCard}
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
    <DragDropContext
      onDragStart={() => setIsDraggingList(true)}
      onDragEnd={(result) => {
        setIsDraggingList(false);
        onDragEnd(result);
      }}
    >
      <h1 className="bg-indigo-500 text-white pl-4 text-2xl font-bold py-4">
        {board.title}
      </h1>

      <div className="flex h-screen overflow-x-auto p-6 bg-gradient-to-tl from-[#1a1c2b] via-[#23263a] to-[#2d3250]">
        {(board.columnOrder ?? ["col-default"]).map(renderColumn)}

        <Droppable
          droppableId="__new_column__"
          direction="vertical"
          type="LIST"
        >
          {(prov, snap) => (
            <div
              ref={prov.innerRef}
              {...prov.droppableProps}
              className={`
              box-border              
              min-w-[296px] mx-5 p-4 flex flex-col items-center justify-center
              transition-opacity duration-300 ease-in-out rounded-lg
          
              border-4 border-dashed
              ${
                snap.isDraggingOver
                  ? "border-white bg-white/20"
                  : "border-white/30 bg-transparent"
              }
          
              ${
                isDraggingList ? "opacity-100" : "opacity-0 pointer-events-none"
              }
              ${isDraggingList && !snap.isDraggingOver ? "animate-pulse" : ""}
            `}
            >
              {snap.isDraggingOver ? (
                <>
                  <svg
                    className="w-6 h-6 mb-1 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-white/70 text-sm">
                    Release to create column
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6 mb-1 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-white/70 text-sm">
                    Drag here to add a column
                  </span>
                </>
              )}
              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );
}
