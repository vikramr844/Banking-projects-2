import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

declare var annyang: any;

@Injectable({
  providedIn: 'root',
})
export class VoiceService {
  private isListening = false;
  private loginForm?: FormGroup;
  private step = 0;
  private loginData: { identifier?: string; password?: string } = {};

  constructor(private router: Router) {}

  initializeVoiceCommands(loginForm?: FormGroup): void {
    if (!annyang) {
      console.error('❌ Annyang is not supported in this browser.');
      return;
    }

    console.log('✅ Annyang is active! Say "Hello Bank" to wake up.');
    this.loginForm = loginForm;

    const commands: { [key: string]: (input?: string) => void } = {
      'hello': () => this.startListening(),
      'hello bank': () => this.startListening(),
      'home': () => this.homePage(),
      'go to home': () => this.homePage(),
      'go back to home': () => this.homePage(),
      'create account': () => this.navigateToRegister(),
      'register': () => this.navigateToRegister(),
      'sign up': () => this.navigateToRegister(),
      'login': () => this.navigateToLogin(),
      'sign in': () => this.navigateToLogin(),
      'reset login': () => this.navigateToLogin(),
      'logout': () => this.logout(),
      'stop': () => this.stopListening(),
      '*input': (input?: string) => this.handleInput(input),
    };

    annyang.addCommands(commands);
    // annyang.abort(); // Stop any existing sessions
    annyang.start({ autoRestart: true, continuous: true });
  }

  private startListening(): void {
    if (!this.isListening) {
      this.isListening = true;
      console.log('🎤 Voice assistant activated.');

      // Resume speech synthesis to bypass Chrome restrictions
      if (speechSynthesis.paused || speechSynthesis.speaking) {
        speechSynthesis.resume();
      }

      this.speak('How can I help you?');
    }
  }

  private homePage(): void {
    if (this.isListening) {
      this.router.navigate(['/']);
      this.speak('Redirecting to Home page.');
    }
  }

  private navigateToLogin(): void {
    if (this.isListening) {
      this.router.navigate(['/login']);
      this.speak('Redirecting to login page. Please say your email or account number.');
      this.step = 1;
    }
  }

  private navigateToRegister(): void {
    if (this.isListening) {
      this.router.navigate(['/register']);
      this.speak('Redirecting to create account page.');
    }
  }

  private logout(): void {
    if (this.isListening) {
      this.router.navigate(['/']);
      this.speak('You have been logged out.');
      this.resetState();
    }
  }

  private stopListening(): void {
    if (this.isListening) {
      this.isListening = false;
      this.speak('Voice recognition stopped.');
      this.step = 0;
    }
  }

  private handleInput(input?: string): void {
    if (!this.isListening || !input) {
      console.warn('⚠️ Voice command received invalid input');
      return;
    }

    // Ignore "Hey Bank" during input processing
    if (input.toLowerCase().includes('hello bank')) {
      console.log('⚠️ Ignoring "Hey Bank" during input processing.');
      return;
    }

    if (this.step === 1) {
      this.loginData.identifier = input;
      this.speak(`You said ${input}. Now, please say your password.`);
      this.step = 2;
      this.updateForm(); // Update form immediately
    } else if (this.step === 2) {
      this.loginData.password = input;
      this.speak('Password received. Say "confirm" to login.');
      this.step = 3;
      this.updateForm(); // Update form immediately
    } else if (this.step === 3 && input.toLowerCase() === 'confirm') {
      if (this.loginForm) {
        this.loginForm.setValue(this.loginData);
        this.speak('Logging in now.');
        this.resetState();
      } else {
        this.speak('Login form is not available.');
      }
    } else {
      this.speak('I did not understand. Please try again.');
    }
  }

  private updateForm(): void {
    if (this.loginForm) {
      this.loginForm.patchValue(this.loginData);
    }
  }

  private speak(message: string): void {
    if ('speechSynthesis' in window) {
      if (!this.isListening) {
        console.warn('⚠️ Speech not allowed without activation.');
        return;
      }

      // Ensure speech synthesis is resumed (important for Chrome)
      speechSynthesis.resume();

      let speech = new SpeechSynthesisUtterance(message);
      speech.lang = 'en-US';
      speech.rate = 1;
      speechSynthesis.speak(speech);
    } else {
      console.error('❌ Speech synthesis not supported in this browser.');
    }
  }
 
  private resetState(): void {
    this.isListening = false;
    this.step = 0;
    this.loginData = {};
  }
}
