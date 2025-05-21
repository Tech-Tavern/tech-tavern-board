import { Droppable, Draggable } from "@hello-pangea/dnd";

export default function List({ list, cards, updateListColor }) {
  // grab title and color from the list object
  const { id, title, color } = list;

  return (
    <div
      className="border-4 border-transparent hover:border-white w-64 p-4 rounded shadow flex flex-col cursor-default"
      // 2) apply the list’s color as background
      style={{ backgroundColor: color }}
    >
      {/* 3) header with title and a color-input */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white">{title}</h2>
        {/* native color picker */}
        <input
          type="color"
          value={color}
          onChange={(e) => updateListColor(id, e.target.value)}
          aria-label="Pick list color"
          className="cursor-pointer"
        />
      </div>

      {/* 4) your existing Droppable for cards */}
      <Droppable droppableId={id} type="CARD">
        {(provided) => (
          <div
            className="border-2 rounded border-transparent flex-1 space-y-2 overflow-y-auto"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(prov) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    className="border-2 border-transparent hover:border-gray-400 bg-white p-2 rounded shadow-sm"
                  >
                    {card.content}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
