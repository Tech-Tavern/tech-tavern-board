import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import ListMenu from "./menus/ListMenu";

export default function List({ list, cards, updateListColor }) {
  const { id, title, color } = list;
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });

  const handleContextMenu = (event) => {
    event.preventDefault();
    setMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleClick = () => {
    if (menu.visible) setMenu({ ...menu, visible: false });
  };

  const hexToRgba = (hex, alpha = 1) => {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return hex;
    const [, r, g, b] = match.map((x) => parseInt(x, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      className="
      border-4 border-transparent w-64 p-4 rounded-lg
      flex flex-col cursor-default ring-white ring-2

      shadow-[0_0_15px_2px_rgba(255,255,255,0.06)]

      hover:shadow-[0_0_22px_4px_rgba(255,255,255,0.45)]
      transition-shadow duration-300
    "
      style={{ backgroundColor: hexToRgba(color, 0.7) }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>

      <Droppable droppableId={String(id)} type="CARD">
        {(provided) => (
          <div
            className="border-2 rounded border-transparent flex-1 space-y-2 overflow-y-auto"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {cards.map((card, index) => (
              <Draggable
                key={card.id}
                draggableId={String(card.id)}
                index={index}
              >
                {(prov) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    className="
                    border-2 border-transparent hover:border-white p-2 rounded shadow-sm text-white
                    bg-gradient-to-tl
                    from-[#1a1c2b]/80   /* 80 % opaque */
                    via-[#23263a]/80
                    to-[#2d3250]/80
                  "
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
