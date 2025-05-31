import { useState, useCallback } from "react";
import { createCardApi, updateCardApi } from "../api/cards";

export default function useCardHooks(boardId, dataState, setDataState) {
  const [isLoading] = useState(false);

  const addCard = useCallback(
    async (listId, text) => {
      const newCardId = `card-${Date.now()}`;
      const newCard = {
        id: newCardId,
        listId,
        title: text,
        description: "",
        color: "default",
        position: dataState.lists[listId].cardIds.length,
        completed: false,
        archived: false,
        createdBy: "uid_CURRENT_USER",
        updatedBy: "uid_CURRENT_USER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic add
      setDataState((prev) => ({
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

      try {
        const createdCard = await createCardApi(boardId, listId, newCard);
        setDataState((prev) => ({
          ...prev,
          cards: {
            ...prev.cards,
            [createdCard.id]: createdCard,
          },
        }));
      } catch (err) {
        console.error("Failed to create card:", err);
      }
    },
    [boardId, dataState.lists, setDataState]
  );

  const renameCard = useCallback(
    async (listId, cardId, newTitle) => {
      // Optimistic rename
      setDataState((prev) => ({
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...prev.cards[cardId],
            title: newTitle,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      try {
        const updated = await updateCardApi(boardId, listId, cardId, {
          title: newTitle,
        });
        setDataState((prev) => ({
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: updated,
          },
        }));
      } catch (err) {
        console.error("Failed to rename card:", err);
      }
    },
    [boardId, setDataState]
  );

  return { isLoading, addCard, renameCard };
}
