
import { deckGroupService } from '../src/features/deck/deck-group-service';
import { flashcardService } from '../src/features/deck/flashcard-service';

function testDeckStructure() {
    console.log("📂 === TESTING DECK STRUCTURE ===\n");

    // 1. Ensure we have data
    // We rely on previous tests creating YouTube cards. 
    // Let's force create a Chat card to verify Hana's Notebook.
    flashcardService.createCard({
        front: "人工知能",
        back: "Artificial Intelligence",
        sourceType: 'chat',
        sourceId: 'session-123'
    });

    // 2. Fetch Dashboard
    const decks = deckGroupService.getDashboardDecks();

    console.log("Your Study Layout:");
    decks.forEach(d => {
        const icon = d.type === 'system_level' ? '📚' : '🎒';
        console.log(`${icon} [${d.id}] ${d.title} --- Due: ${d.dueCards}/${d.totalCards}`);
    });
}

testDeckStructure();
