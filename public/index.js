// Previous code for onboarding button
\nconst onboardingButton = document.getElementById('onboarding-button');
\nonboardingButton.addEventListener('click', function() {
    // Change this line:
    // this.style.display = 'none';
    this.classList.add('hidden'); // Use classList to hide the button
});