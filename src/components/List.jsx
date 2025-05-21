import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import ListMenu from "./menus/ListMenu";

export default function List({ list, cards, updateListColor }) {
  const { id, title, color } = list;
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const handleContextMenu = (event) => {
    event.preventDefault(); // stop the default menu
    setMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleClick = () => {
    if (menu.visible) {
      setMenu({ ...menu, visible: false });
      console.log("Clicked outside the menu");
    }
  };
  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      className="border-4 border-transparent hover:border-white w-64 p-4 rounded shadow-1xl ring-2 ring-black ring-opacity-5 flex flex-col cursor-default"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white">{title}</h2>
        {/* <input
          type="color"
          value={color}
          onChange={(e) => updateListColor(id, e.target.value)}
          aria-label="Pick list color"
          className="cursor-pointer"
        /> */}
      </div>

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
      {menu.visible && (
        <ListMenu
          x={menu.x}
          y={menu.y}
          updateListColor={updateListColor}
          id={id}
          color={color}
        />
      )}
    </div>
  );
}
