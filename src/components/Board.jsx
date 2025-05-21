import { useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import List from "./List";

export default function Board({ boardId, data, setData, updateListColor }) {
  const board = data.boards[boardId];

  const containerRef = useRef(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    if (type === "LIST") {
      const newListIds = Array.from(board.listIds);
      newListIds.splice(source.index, 1);
      newListIds.splice(destination.index, 0, draggableId);

      const newBoard = { ...board, listIds: newListIds };
      setData((prev) => ({
        ...prev,
        boards: { ...prev.boards, [boardId]: newBoard },
      }));
      return;
    }

    if (type === "CARD") {
      setData((prev) => {
        const startList = prev.lists[source.droppableId];
        const finishList = prev.lists[destination.droppableId];

        if (startList === finishList) {
          const newCardIds = Array.from(startList.cardIds);
          newCardIds.splice(source.index, 1);
          newCardIds.splice(destination.index, 0, draggableId);

          const newList = { ...startList, cardIds: newCardIds };
          return {
            ...prev,
            lists: { ...prev.lists, [newList.id]: newList },
          };
        }

        const startCardIds = Array.from(startList.cardIds);
        startCardIds.splice(source.index, 1);
        const newStart = { ...startList, cardIds: startCardIds };

        const finishCardIds = Array.from(finishList.cardIds);
        finishCardIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finishList, cardIds: finishCardIds };

        return {
          ...prev,
          lists: {
            ...prev.lists,
            [newStart.id]: newStart,
            [newFinish.id]: newFinish,
          },
        };
      });
      return;
    }
  };

  const onMouseDown = (e) => {      
    if (e.button !== 0 || e.target !== containerRef.current) return;
    setIsDraggingScroll(true);
    e.preventDefault();
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };
  const onMouseUp = () => setIsDraggingScroll(false);
  const onMouseLeave = () => setIsDraggingScroll(false);
  const onMouseMove = (e) => {
    if (!isDraggingScroll) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = x - startX;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <h1 className="bg-indigo-600 text-white pl-4 text-2xl font-bold py-4">
        {board.title}
      </h1>
      <Droppable droppableId={board.id} direction="horizontal" type="LIST">
        {(provided) => (
          <div
            ref={(el) => {
              containerRef.current = el;
              provided.innerRef(el);
            }}
            {...provided.droppableProps}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            className="select-text md:select-auto
              flex items-start gap-8 overflow-x-scroll py-8 px-6
              bg-gradient-to-br from-indigo-400 to-blue-100
              h-full scroll-pl-6 snap-x snap-mandatory
            "
          >
            {board.listIds.map((listId, index) => {
              const list = data.lists[listId];
              const cards = list.cardIds.map((cid) => data.cards[cid]);

              return (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(prov) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      className="flex-none"
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
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
