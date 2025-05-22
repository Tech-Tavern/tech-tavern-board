// src/components/Board.jsx
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import List from "./List";

export default function Board({ boardId, data, setData, updateListColor }) {
  const board = data.boards[boardId];

  const onDragEnd = ({ source, destination, draggableId, type }) => {
    if (!destination) return;

    if (type === "CARD") {
      setData((prev) => {
        const start = prev.lists[source.droppableId];
        const finish = prev.lists[destination.droppableId];

        if (start === finish) {
          const ids = Array.from(start.cardIds);
          ids.splice(source.index, 1);
          ids.splice(destination.index, 0, draggableId);
          return {
            ...prev,
            lists: { ...prev.lists, [start.id]: { ...start, cardIds: ids } },
          };
        }

        const startIds = Array.from(start.cardIds);
        startIds.splice(source.index, 1);
        const finishIds = Array.from(finish.cardIds);
        finishIds.splice(destination.index, 0, draggableId);

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

    if (type !== "LIST") return;

    setData((prev) => {
      const b = prev.boards[boardId];
      const order = b.columnOrder ?? ["col-default"];
      const columns = b.columns ?? {
        "col-default": {
          id: "col-default",
          listIds: b.listIds ?? [],
        },
      };

      let nextOrder = [...order];
      let nextCols = { ...columns };

      if (destination.droppableId === "__new_column__") {
        const newCol = `col-${Date.now()}`;
        const from = source.droppableId;

        nextOrder.push(newCol);
        nextCols[from] = {
          ...nextCols[from],
          listIds: nextCols[from].listIds.filter((id) => id !== draggableId),
        };
        nextCols[newCol] = {
          id: newCol,
          listIds: [draggableId],
        };
      } else {
        const from = source.droppableId;
        const to = destination.droppableId;

        if (from === to) {
          const ids = Array.from(nextCols[from].listIds);
          ids.splice(source.index, 1);
          ids.splice(destination.index, 0, draggableId);
          nextCols[from] = { ...nextCols[from], listIds: ids };
        } else {
          const fromIds = Array.from(nextCols[from].listIds);
          fromIds.splice(source.index, 1);
          const toIds = Array.from(nextCols[to].listIds);
          toIds.splice(destination.index, 0, draggableId);
          nextCols[from] = { ...nextCols[from], listIds: fromIds };
          nextCols[to] = { ...nextCols[to], listIds: toIds };
        }
      }

      nextOrder = nextOrder.filter((id) => nextCols[id]?.listIds.length);
      nextCols = Object.fromEntries(nextOrder.map((id) => [id, nextCols[id]]));

      if (nextOrder.length === 0) {
        nextOrder.push("col-default");
        nextCols["col-default"] = {
          id: "col-default",
          listIds: [],
        };
      }

      return {
        ...prev,
        boards: {
          ...prev.boards,
          [boardId]: { ...b, columnOrder: nextOrder, columns: nextCols },
        },
      };
    });
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
                <Draggable key={lid} draggableId={lid} index={idx}>
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

      <div
        className="flex h-screen overflow-auto p-6
                bg-gradient-to-tl from-[#1a1c2b] via-[#23263a] to-[#2d3250]"
      >
        {(board.columnOrder ?? ["col-default"]).map(renderColumn)}

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
