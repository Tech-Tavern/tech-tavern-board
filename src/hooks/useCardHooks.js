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
        // Replace the temp card ID with the real one from the server
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
      // Optimistic rename in state
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
        // Replace with server‐returned object
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

  const moveCard = useCallback(
    async (sourceListId, destinationListId, sourceIndex, destinationIndex) => {
      const allLists = dataState.lists;
      const allCards = dataState.cards;

      const cardId = allLists[sourceListId].cardIds[sourceIndex];
      if (!cardId) return;

      const sourceCardIds = Array.from(allLists[sourceListId].cardIds);
      const destCardIds = Array.from(allLists[destinationListId].cardIds);

      let updatedSourceCardIds, updatedDestCardIds;

      if (sourceListId === destinationListId) {
        sourceCardIds.splice(sourceIndex, 1);
        sourceCardIds.splice(destinationIndex, 0, cardId);
        updatedSourceCardIds = sourceCardIds;
        updatedDestCardIds = sourceCardIds;
      } else {
        sourceCardIds.splice(sourceIndex, 1);
        destCardIds.splice(destinationIndex, 0, cardId);
        updatedSourceCardIds = sourceCardIds;
        updatedDestCardIds = destCardIds;
      }

      const newLists = {
        ...allLists,
        [sourceListId]: {
          ...allLists[sourceListId],
          cardIds: updatedSourceCardIds,
        },
        [destinationListId]: {
          ...allLists[destinationListId],
          cardIds: updatedDestCardIds,
        },
      };

      const newCards = { ...allCards };

      if (sourceListId !== destinationListId) {
        newCards[cardId] = {
          ...newCards[cardId],
          listId: destinationListId,
        };
      }

      updatedSourceCardIds.forEach((cId, idx) => {
        newCards[cId] = {
          ...newCards[cId],
          position: idx,
        };
      });

      if (sourceListId !== destinationListId) {
        updatedDestCardIds.forEach((cId, idx) => {
          newCards[cId] = {
            ...newCards[cId],
            position: idx,
          };
        });
      }

      setDataState((prev) => ({
        ...prev,
        lists: newLists,
        cards: newCards,
      }));

      try {
        const updates = [];

        if (sourceListId === destinationListId) {
          updatedSourceCardIds.forEach((cId, idx) => {
            console.log(
              "[moveCard] PUT",
              `/boards/${boardId}/lists/${sourceListId}/cards/${cId}`,
              { position: idx }
            );
            updates.push(
              updateCardApi(boardId, sourceListId, cId, { position: idx })
            );
          });
        } else {
          // Cross-list move:
          updatedSourceCardIds.forEach((cId, idx) => {
            console.log(
              "[moveCard] PUT",
              `/boards/${boardId}/lists/${sourceListId}/cards/${cId}`,
              { position: idx }
            );
            updates.push(
              updateCardApi(boardId, sourceListId, cId, { position: idx })
            );
          });
          updatedDestCardIds.forEach((cId, idx) => {
            if (cId === cardId) {
              console.log(
                "[moveCard] PUT",
                `/boards/${boardId}/lists/${destinationListId}/cards/${cId}`,
                { listId: BigInt(destinationListId), position: idx }
              );
              updates.push(
                updateCardApi(boardId, destinationListId, cId, {
                  listId: destinationListId,
                  position: idx,
                })
              );
            } else {
              console.log(
                "[moveCard] PUT",
                `/boards/${boardId}/lists/${destinationListId}/cards/${cId}`,
                { position: idx }
              );
              updates.push(
                updateCardApi(boardId, destinationListId, cId, {
                  position: idx,
                })
              );
            }
          });
        }

        await Promise.all(updates);
      } catch (err) {
        console.error("Failed to persist moved‐cards:", err);
      }
    },
    [boardId, dataState.lists, dataState.cards, setDataState]
  );

  return {
    isLoading,
    addCard,
    renameCard,
    moveCard,
  };
}
