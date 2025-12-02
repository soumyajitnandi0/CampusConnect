// Navigation type definitions for Expo Router

export type RootStackParamList = {
  '(auth)': undefined;
  '(student)': undefined;
  '(organizer)': undefined;
  'event/[id]': { id: string };
  'qr-code/[eventId]': { eventId: string };
};

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  'select-role': { token: string };
};

export type StudentTabParamList = {
  index: undefined;
  explore: undefined;
  scan: undefined;
  profile: undefined;
};

export type OrganizerTabParamList = {
  index: undefined;
  'create-event': undefined;
  'event-details': { id: string };
  profile: undefined;
};

