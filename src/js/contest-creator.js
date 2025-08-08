// Contest Creator for manual daily and weekly contest creation
// Browser-compatible version

class ContestCreator {
  constructor() {
    this.oddsAPI = null;
    this.walletManager = null;
    this.availableGames = [];
    this.selectedGames = [];
    this.contest = {
      type: '',
      name: '',
      entryFee: 0,
      maxParticipants: 0,
      description: '',
      deadline: null,
      games: []
    };
  }

  async init() {
    try {
      console.log('🎮 Initializing Contest Creator...');
      
      // Initialize APIs
      this.oddsAPI = new OddsAPI();
      await this.oddsAPI.init();
      
      this.walletManager = new WalletManager();
      await this.walletManager.init();

      // Set up event listeners
      this.setupEventListeners();
      
      // Load available games
      await this.loadAvailableGames();
      
      // Set default deadline (tomorrow at noon)
      this.setDefaultDeadline();
      
      console.log('✅ Contest Creator initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Contest Creator:', error);
      this.showError('Failed to initialize contest creator. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('contest-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createContest();
    });

    // Form field changes to update preview
    const formFields = ['contest-type', 'contest-name', 'entry-fee', 'max-participants', 'deadline'];
    formFields.forEach(fieldId => {
      document.getElementById(fieldId).addEventListener('input', () => {
        this.updatePreview();
      });
    });

    // Contest type change
    document.getElementById('contest-type').addEventListener('change', (e) => {
      this.handleContestTypeChange(e.target.value);
    });

    // Wallet connection
    const walletBtn = document.getElementById('wallet-connect');
    if (walletBtn) {
      walletBtn.addEventListener('click', () => {
        this.walletManager.connectWallet();
      });
    }
  }

  async loadAvailableGames() {
    try {
      console.log('🏈 Loading available games...');
      const gamesContainer = document.getElementById('games-selection');
      
      gamesContainer.innerHTML = '<div class="loading-spinner">Loading MLB games...</div>';

      // Get today and tomorrow's MLB games
      const games = await this.oddsAPI.getTodaysGames();
      this.availableGames = games;

      if (games.length === 0) {
        gamesContainer.innerHTML = `
          <div class="no-games">
            <h3>No Games Available</h3>
            <p>No MLB games found for today and tomorrow.</p>
          </div>
        `;
        return;
      }

      // Render game options
      this.renderGameOptions();
      console.log(`✅ Loaded ${games.length} available games`);

    } catch (error) {
      console.error('❌ Error loading games:', error);
      document.getElementById('games-selection').innerHTML = `
        <div class="error">
          <h3>Error Loading Games</h3>
          <p>Unable to load available games. Please try again.</p>
        </div>
      `;
    }
  }

  renderGameOptions() {
    const gamesContainer = document.getElementById('games-selection');
    
    gamesContainer.innerHTML = this.availableGames.map((game, index) => `
      <div class="game-option">
        <input 
          type="checkbox" 
          id="game-${index}" 
          value="${game.id}" 
          onchange="contestCreator.toggleGameSelection('${game.id}', this.checked)"
        >
        <label for="game-${index}" class="game-info">
          <div class="game-teams">${game.awayTeam} @ ${game.homeTeam}</div>
          <div class="game-time">${this.formatGameTime(game.startTime)} - ${game.sportTitle}</div>
        </label>
      </div>
    `).join('');
  }

  toggleGameSelection(gameId, isSelected) {
    if (isSelected) {
      if (!this.selectedGames.includes(gameId)) {
        this.selectedGames.push(gameId);
      }
    } else {
      this.selectedGames = this.selectedGames.filter(id => id !== gameId);
    }
    
    console.log(`🎯 Selected games: ${this.selectedGames.length}`);
    this.updatePreview();
  }

  handleContestTypeChange(type) {
    console.log(`📅 Contest type changed to: ${type}`);
    
    // Update form based on contest type
    if (type === 'weekly') {
      // For weekly contests, suggest longer deadline
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(12, 0, 0, 0);
      document.getElementById('deadline').value = this.formatDateTimeLocal(nextWeek);
    } else if (type === 'daily') {
      // For daily contests, suggest tomorrow
      this.setDefaultDeadline();
    }
    
    this.updatePreview();
  }

  setDefaultDeadline() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Tomorrow at noon
    document.getElementById('deadline').value = this.formatDateTimeLocal(tomorrow);
  }

  updatePreview() {
    const type = document.getElementById('contest-type').value;
    const name = document.getElementById('contest-name').value;
    const entryFee = parseInt(document.getElementById('entry-fee').value) || 0;
    const maxParticipants = parseInt(document.getElementById('max-participants').value) || 0;
    
    // Update preview stats
    document.getElementById('preview-games').textContent = this.selectedGames.length;
    document.getElementById('preview-fee').textContent = entryFee;
    document.getElementById('preview-max').textContent = maxParticipants;
    document.getElementById('preview-prize').textContent = entryFee * maxParticipants;
    
    // Show/hide preview
    const preview = document.getElementById('contest-preview');
    if (type && name && entryFee > 0 && this.selectedGames.length > 0) {
      preview.style.display = 'block';
      
      // Update preview details
      const details = document.getElementById('preview-details');
      details.innerHTML = `
        <h4>${name}</h4>
        <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)} Contest</p>
        <p><strong>Games:</strong> ${this.selectedGames.length} MLB games selected</p>
        <p><strong>Entry Fee:</strong> ${entryFee} NUTS tokens</p>
        <p><strong>Max Players:</strong> ${maxParticipants}</p>
        <p><strong>Total Prize Pool:</strong> ${entryFee * maxParticipants} NUTS tokens</p>
      `;
    } else {
      preview.style.display = 'none';
    }
  }

  async createContest() {
    try {
      console.log('🚀 Creating contest...');
      
      // Validate form
      if (!this.validateForm()) {
        return;
      }

      // Collect form data
      const contestData = this.collectFormData();
      
      // Check wallet connection
      if (!this.walletManager.isConnected) {
        this.showError('Please connect your wallet to create a contest.');
        return;
      }

      this.showSuccess('Creating contest...');

      // Simulate contest creation (in production, this would interact with smart contracts)
      await this.simulateContestCreation(contestData);
      
      this.showSuccess(`Contest "${contestData.name}" created successfully! Contest ID: ${contestData.id}`);
      
      // Reset form after successful creation
      setTimeout(() => {
        this.resetForm();
      }, 3000);

    } catch (error) {
      console.error('❌ Error creating contest:', error);
      this.showError(`Failed to create contest: ${error.message}`);
    }
  }

  validateForm() {
    const type = document.getElementById('contest-type').value;
    const name = document.getElementById('contest-name').value;
    const entryFee = parseInt(document.getElementById('entry-fee').value);
    const maxParticipants = parseInt(document.getElementById('max-participants').value);
    const deadline = document.getElementById('deadline').value;

    if (!type) {
      this.showError('Please select a contest type.');
      return false;
    }

    if (!name || name.trim().length < 3) {
      this.showError('Please enter a contest name (at least 3 characters).');
      return false;
    }

    if (!entryFee || entryFee < 1) {
      this.showError('Please enter a valid entry fee (minimum 1 NUTS).');
      return false;
    }

    if (!maxParticipants || maxParticipants < 2) {
      this.showError('Please enter a valid maximum participants (minimum 2).');
      return false;
    }

    if (!deadline) {
      this.showError('Please set a registration deadline.');
      return false;
    }

    if (this.selectedGames.length === 0) {
      this.showError('Please select at least one game for the contest.');
      return false;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      this.showError('Registration deadline must be in the future.');
      return false;
    }

    return true;
  }

  collectFormData() {
    const selectedGameObjects = this.availableGames.filter(game => 
      this.selectedGames.includes(game.id)
    );

    return {
      id: `contest_${Date.now()}`,
      type: document.getElementById('contest-type').value,
      name: document.getElementById('contest-name').value.trim(),
      entryFee: parseInt(document.getElementById('entry-fee').value),
      maxParticipants: parseInt(document.getElementById('max-participants').value),
      description: document.getElementById('contest-description').value.trim(),
      deadline: new Date(document.getElementById('deadline').value),
      games: selectedGameObjects,
      creator: this.walletManager.wallet?.address || 'Unknown',
      createdAt: new Date(),
      status: 'active',
      participants: [],
      prizePool: parseInt(document.getElementById('entry-fee').value) * parseInt(document.getElementById('max-participants').value)
    };
  }

  async simulateContestCreation(contestData) {
    console.log('📝 Contest data:', contestData);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store contest locally (in production, this would be stored on-chain or in a database)
    const existingContests = JSON.parse(localStorage.getItem('nuts_created_contests') || '[]');
    existingContests.push(contestData);
    localStorage.setItem('nuts_created_contests', JSON.stringify(existingContests));
    
    console.log('✅ Contest created and stored locally');
    
    // Simulate blockchain transaction
    console.log('⛓️ Simulating blockchain transaction...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return contestData;
  }

  resetForm() {
    document.getElementById('contest-form').reset();
    this.selectedGames = [];
    this.setDefaultDeadline();
    document.getElementById('contest-preview').style.display = 'none';
    
    // Uncheck all game selections
    const checkboxes = document.querySelectorAll('#games-selection input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    this.clearMessages();
    console.log('🔄 Form reset');
  }

  formatGameTime(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} ${timeStr}`;
    }
  }

  formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showMessage(message, type) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(messageDiv);
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 5000);
    }
  }

  clearMessages() {
    document.getElementById('messages').innerHTML = '';
  }
}

// Global functions for HTML onclick handlers
function resetForm() {
  if (window.contestCreator) {
    window.contestCreator.resetForm();
  }
}

// Initialize when page loads
let contestCreator;

document.addEventListener('DOMContentLoaded', async () => {
  contestCreator = new ContestCreator();
  window.contestCreator = contestCreator;
  await contestCreator.init();
});

console.log('🎮 Contest Creator script loaded');
