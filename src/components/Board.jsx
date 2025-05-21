import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import List from "./List";

export default function Board({ boardId, data, setData, updateListColor }) {
  const board = data.boards[boardId];

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
            lists: {
              ...prev.lists,
              [newList.id]: newList,
            },
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <h1 className="bg-indigo-500 text-white pl-4 text-2xl font-bold py-4">
        {board.title}
      </h1>
      {/* gradient background + horizontal scrolling */}
      <Droppable droppableId={board.id} direction="horizontal" type="LIST">
        {(provided) => (
          <div
            className="
          flex items-start gap-8 overflow-x-scroll py-8 px-6 
          bg-gradient-to-br from-indigo-400  to-blue-100 
          h-full 
          scroll-pl-6 snap-x snap-mandatory
        "
            ref={provided.innerRef}
            {...provided.droppableProps}
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
