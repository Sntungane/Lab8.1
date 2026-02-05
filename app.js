/* Minimal flashcards app with delegated events and 3D flip toggling */
(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  const newDeckBtn = qs('#newDeckBtn');
  const deckList = qs('#deckList');
  const deckEmptyState = qs('#deckEmptyState');
  const activeDeckTitle = qs('#activeDeckTitle');
  const editDeckBtn = qs('#editDeckBtn');
  const deleteDeckBtn = qs('#deleteDeckBtn');
  const searchInput = qs('#searchInput');
  const shuffleBtn = qs('#shuffleBtn');
  const newCardBtn = qs('#newCardBtn');
  const cardGrid = qs('#cardGrid');

  let state = { decks: [], activeDeckId: null };

  function save(){ localStorage.setItem('flashcards_state', JSON.stringify(state)); }
  function load(){ const raw = localStorage.getItem('flashcards_state'); if(raw) state = JSON.parse(raw); }

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

  function renderDeckList(){
    deckList.innerHTML = '';
    if(state.decks.length === 0){ deckEmptyState.hidden = false; return; }
    deckEmptyState.hidden = true;
    state.decks.forEach(d => {
      const li = document.createElement('li');
      li.textContent = d.name;
      li.dataset.deckId = d.id;
      if(d.id === state.activeDeckId) li.style.background = '#eef3ff';
      deckList.appendChild(li);
    });
  }

  function getActiveDeck(){ return state.decks.find(d => d.id === state.activeDeckId) || null; }

  function setActiveDeck(id){ state.activeDeckId = id; save(); renderAll(); }

  function renderAll(){
    renderDeckList();
    const deck = getActiveDeck();
    if(!deck){ activeDeckTitle.textContent = 'No deck selected'; editDeckBtn.disabled = true; deleteDeckBtn.disabled = true; searchInput.disabled = true; shuffleBtn.disabled = true; newCardBtn.disabled = true; cardGrid.innerHTML = ''; return; }

    activeDeckTitle.textContent = deck.name;
    editDeckBtn.disabled = false; deleteDeckBtn.disabled = false; searchInput.disabled = false; shuffleBtn.disabled = false; newCardBtn.disabled = false;
    renderCards(deck.cards);
  }

  function renderCards(cards){
    const q = (searchInput && searchInput.value || '').toLowerCase().trim();
    const list = cards.filter(c => !q || (c.front + ' ' + c.back).toLowerCase().includes(q));
    cardGrid.innerHTML = '';
    if(list.length === 0){ cardGrid.innerHTML = '<p class="empty-state">No cards</p>'; return; }

    list.forEach(c => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.cardId = c.id;

      el.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-front">
            <div class="card-controls">
              <button class="edit-btn btn" title="Edit">Edit</button>
              <button class="delete-btn btn btn-danger" title="Delete">Del</button>
            </div>
            <div class="card-text">${escapeHtml(c.front)}</div>
          </div>
          <div class="card-face card-back">
            <div class="card-text">${escapeHtml(c.back)}</div>
          </div>
        </div>`;
      cardGrid.appendChild(el);
    });
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Event handlers
  newDeckBtn.addEventListener('click', ()=>{
    const name = prompt('New deck name:','New Deck');
    if(!name) return;
    const deck = { id: uid(), name: name.trim(), cards: [] };
    state.decks.push(deck);
    setActiveDeck(deck.id);
    save();
  });

  deckList.addEventListener('click', e =>{
    const li = e.target.closest('li'); if(!li) return;
    setActiveDeck(li.dataset.deckId);
  });

  editDeckBtn.addEventListener('click', ()=>{
    const deck = getActiveDeck(); if(!deck) return;
    const name = prompt('Edit deck name:', deck.name); if(!name) return;
    deck.name = name.trim(); save(); renderAll();
  });

  deleteDeckBtn.addEventListener('click', ()=>{
    const deck = getActiveDeck(); if(!deck) return;
    if(!confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) return;
    state.decks = state.decks.filter(d => d.id !== deck.id);
    state.activeDeckId = state.decks.length ? state.decks[0].id : null;
    save(); renderAll();
  });

  newCardBtn.addEventListener('click', ()=>{
    const deck = getActiveDeck(); if(!deck) return;
    const front = prompt('Card front:','Question'); if(front === null) return;
    const back = prompt('Card back:','Answer'); if(back === null) return;
    deck.cards.push({ id: uid(), front: front.trim(), back: back.trim() });
    save(); renderAll();
  });

  shuffleBtn.addEventListener('click', ()=>{
    const deck = getActiveDeck(); if(!deck) return;
    for(let i = deck.cards.length -1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [deck.cards[i], deck.cards[j]] = [deck.cards[j], deck.cards[i]]; }
    save(); renderAll();
  });

  searchInput && searchInput.addEventListener('input', ()=>{ renderAll(); });

  // Delegated card events
  cardGrid.addEventListener('click', e =>{
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    const cardEl = e.target.closest('.card');
    if(editBtn){
      const cardId = editBtn.closest('.card').dataset.cardId;
      const deck = getActiveDeck(); if(!deck) return;
      const card = deck.cards.find(c => c.id === cardId); if(!card) return;
      const front = prompt('Edit front:', card.front); if(front === null) return;
      const back = prompt('Edit back:', card.back); if(back === null) return;
      card.front = front.trim(); card.back = back.trim(); save(); renderAll();
      return;
    }

    if(deleteBtn){
      const cardId = deleteBtn.closest('.card').dataset.cardId;
      const deck = getActiveDeck(); if(!deck) return;
      if(!confirm('Delete this card?')) return;
      deck.cards = deck.cards.filter(c => c.id !== cardId); save(); renderAll();
      return;
    }

    // Toggle flip when clicking a card that is NOT a control button
    if(cardEl){
      // toggle 'is-flipped' on the card
      cardEl.classList.toggle('is-flipped');
    }
  });

  // Initialize
  load();
  // if there is no activeDeck but decks exist, pick first
  if(!state.activeDeckId && state.decks.length) state.activeDeckId = state.decks[0].id;
  renderAll();

})();
