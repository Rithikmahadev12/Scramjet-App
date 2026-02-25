// Updated to use the standard fetch API to load games

const fetchGames = async () => {
    try {
        const response = await fetch('your-api-url'); // Replace with your API endpoint
        const data = await response.json();
        // Process your game data here
    } catch (error) {
        console.error('Error loading games:', error);
    }
};

fetchGames();