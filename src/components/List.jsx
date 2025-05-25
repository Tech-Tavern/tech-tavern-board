import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useRef, useEffect } from "react";
import ListMenu from "./menus/ListMenu";

export default function List({
  list,
  cards,
  updateListColor,
  onAddList,
  onRenameList,
  onDeleteList,
  onAddCard, 
  onRenameCard,
}) {
  const { id, title, color } = list;

  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenu({ visible: true, x: e.clientX, y: e.clientY });
  };
  const hideMenu = () => setMenu({ 
    visible: false, x: 0, y: 0 
  }, console.log("L ID: " + list.id + " POS: " + list.position, "COL: " + list.columnPos));

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const titleInputRef = useRef(null);
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  const finishTitleEdit = () => {
    const val = titleInput.trim();
    if (val && val !== title) onRenameList(id, val);
    setIsEditingTitle(false);
  };
  const handleTitleKey = (e) => {
    if (e.key === "Enter") finishTitleEdit();
    if (e.key === "Escape") {
      setTitleInput(title);
      setIsEditingTitle(false);
    }
  };

  const [editingCardId, setEditingCardId] = useState(null);
  const [cardInput, setCardInput] = useState("");
  const cardInputRef = useRef(null);
  useEffect(() => {
    if (editingCardId && cardInputRef.current) {
      cardInputRef.current.focus();
      cardInputRef.current.select();
    }
  }, [editingCardId]);
  const finishCardEdit = () => {
    const val = cardInput.trim();
    if (val) onRenameCard(editingCardId, val);
    setEditingCardId(null);
    setCardInput("");
  };
  const handleCardKey = (e) => {
    if (e.key === "Enter") finishCardEdit();
    if (e.key === "Escape") {
      setEditingCardId(null);
      setCardInput("");
    }
  };

  // inline‐add‐card
  const [isAdding, setIsAdding] = useState(false);
  const [newCardText, setNewCardText] = useState("");
  const addInputRef = useRef(null);
  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);
  const finishAdd = () => {
    const text = newCardText.trim();
    if (text) onAddCard(id, text);
    setIsAdding(false);
    setNewCardText("");
  };
  const handleAddKey = (e) => {
    if (e.key === "Enter") finishAdd();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewCardText("");
    }
  };

  const hexToRgba = (hex, alpha = 1) => {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return hex;
    const [, rr, gg, bb] = m;
    return `rgba(${parseInt(rr, 16)}, ${parseInt(gg, 16)}, ${parseInt(
      bb,
      16
    )}, ${alpha})`;
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={hideMenu}
      className="relative border-4 border-transparent w-62 p-4 rounded-lg flex flex-col cursor-default ring-white ring-2 shadow-[0_0_15px_2px_rgba(255,255,255,0.06)] hover:shadow-[0_0_22px_4px_rgba(255,255,255,0.45)] transition-shadow duration-300"
      style={{ backgroundColor: hexToRgba(color, 1) }}
    >
      {/* Title / Inline Edit */}
      <div className="flex items-center justify-between mb-3">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={finishTitleEdit}
            onKeyDown={handleTitleKey}
            className="w-full px-1 py-0.5 font-bold text-gray-900 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <h2
            className="font-bold text-gray-900 cursor-text"
            onClick={() => {
              setTitleInput(title);
              setIsEditingTitle(true);
            }}
          >
            {title}
          </h2>
        )}
      </div>

      {/* Cards */}
      <Droppable droppableId={String(id)} type="CARD">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 space-y-2 overflow-y-auto"
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
                  >
                    {editingCardId === card.id ? (
                      <input
                        ref={cardInputRef}
                        value={cardInput}
                        onChange={(e) => setCardInput(e.target.value)}
                        onBlur={finishCardEdit}
                        onKeyDown={handleCardKey}
                        className="w-full p-2 border-3 border-white focus:outline-none focus:ring"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => {
                          setEditingCardId(card.id);
                          setCardInput(card.content);
                        }}
                        className="
                          border-2 border-transparent hover:border-white p-2 rounded shadow-sm text-white
                          bg-gradient-to-tl from-[#1a1c2b]/80 via-[#23263a]/80 to-[#2d3250]/80
                          cursor-grab
                        "
                      >
                        {card.content}
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {/* Add Card → inline input */}
            {isAdding ? (
              <input
                ref={addInputRef}
                value={newCardText}
                onChange={(e) => setNewCardText(e.target.value)}
                onBlur={finishAdd}
                onKeyDown={handleAddKey}
                placeholder="Enter card title"
                className="
                w-full px-2 py-1 text-sm rounded border border-white
                focus:outline-none
                focus:ring-2
                focus:ring-white/75
              "
              />
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full text-center mt-2 px-2 py-1 text-sm text-gray-700 bg-gray-100/50 hover:bg-gray-200 rounded cursor-pointer"
              >
                + Add Card
              </button>
            )}
          </div>
        )}
      </Droppable>

      {/* Context Menu */}
      {menu.visible && (
        <ListMenu
          x={menu.x}
          y={menu.y}
          updateListColor={updateListColor}
          id={id}
          color={color}
          onAdd={() => {
            onAddList(id);
            hideMenu();
          }}
          onRename={() => {
            setIsEditingTitle(true);
            hideMenu();
          }}
          onDelete={() => {
            onDeleteList(id);
            hideMenu();
          }}
        />
      )}
    </div>
  );
}
