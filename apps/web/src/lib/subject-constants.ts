/** Question-bank skills use the existing section_type IDs.
 * A filter category does not imply that AI/audio/scoring supports that skill. */
export const PRACTICE_SECTIONS = [
  { id: "READING", name: "Reading", icon: "menu_book", supportsGeneration: true },
  { id: "LISTENING", name: "Listening", icon: "headphones", supportsGeneration: true },
  { id: "WRITING", name: "Writing", icon: "edit_note", supportsGeneration: true },
  { id: "SPEAKING", name: "Speaking", icon: "mic", supportsGeneration: true },
];
