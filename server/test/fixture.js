export function fixture() {
  return {
    title: 'The Missing Manuscript', story: 'A manuscript disappeared after the gallery closed. Three staff members remained.', setting: 'The fictional Westbridge Museum',
    suspects: [
      { id: 'S1', name: 'Mira Vale', description: 'Museum curator', motive: 'Conceal an inventory error', alibi: 'Reviewing the inventory in her office', relationships: 'Supervises Theo and Iris' },
      { id: 'S2', name: 'Theo Reed', description: 'Restorer', motive: 'Settle a private debt', alibi: 'Claims to have stayed in the workshop', relationships: 'Works for Mira; knows Iris' },
      { id: 'S3', name: 'Iris Bell', description: 'Night guard', motive: 'Dispute over unpaid overtime', alibi: 'At the loading dock, confirmed by delivery records', relationships: 'Colleague of Theo and Mira' }
    ],
    evidence: [
      { id: 'E1', type: 'chat', title: 'Workshop messages', description: 'Recovered fictional conversation', timestamp: '21:04', messages: [{ sender: 'Theo', timestamp: '21:04', text: 'I will be in the workshop all night.' }, { sender: 'Mira', timestamp: '21:05', text: 'Please leave the gallery locked.' }], imagePrompt: '' },
      { id: 'E2', type: 'cctv', title: 'Gallery access', description: 'Theo enters the gallery with a red restoration case at 21:12.', timestamp: '21:12', messages: [], imagePrompt: 'Fictional grainy security frame of a restorer entering a gallery' },
      { id: 'E3', type: 'image', title: 'Restoration case', description: 'The missing manuscript is visible beneath the lining of the red case assigned to Theo.', timestamp: '22:00', messages: [], imagePrompt: 'Open red restoration case containing an old manuscript' },
      { id: 'E4', type: 'image', title: 'Delivery receipt', description: 'A signed receipt places Iris at the loading dock at 21:12.', timestamp: '21:12', messages: [], imagePrompt: 'Fictional delivery receipt' },
      { id: 'E5', type: 'cctv', title: 'Office corridor', description: 'Mira stays in her office from 21:00 until 21:30.', timestamp: '21:30', messages: [], imagePrompt: 'Fictional office corridor security still' }
    ],
    timeline: [{ time: '21:00', event: 'Museum closes.' }, { time: '21:12', event: 'Gallery access is recorded.' }, { time: '22:00', event: 'The missing item is reported.' }],
    solution: { culpritId: 'S2', explanation: 'Theo contradicted his workshop alibi by entering the gallery at 21:12 (E2). The manuscript was found inside his assigned case (E3). The independent location records rule out Mira and Iris.', supportingEvidenceIds: ['E2', 'E3'], timeline: [{ time: '21:04', event: 'Theo sends a false workshop alibi.' }, { time: '21:12', event: 'Theo takes the manuscript from the gallery.' }, { time: '22:00', event: 'The manuscript is recovered from his case.' }] }
  };
}
