export const Session = {
  id: crypto.randomUUID(),

  participantId: localStorage.getItem("participant_id"),
  gender: localStorage.getItem("participant_gender"),

  round: 1,
  blockType: null,
  responses: []
};

