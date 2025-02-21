import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ResponsiveVoiceService } from '../services/responsive-voice.service';
import { LoginComponent } from '../components/login/login.component';
import { RegisterComponent } from '../components/register/register.component';
import { LoadermodelService } from 'src/app/services/loadermodel.service';

declare var annyang: any;

@Injectable({
  providedIn: 'root',
})
export class VoiceService {

  private isListening = false;
  private loginForm?: FormGroup;
  private registerForm?: FormGroup;
  private loginComponent?: LoginComponent;
  private registerComponent?: RegisterComponent;
  private loader?: LoadermodelService;
  private step = 0;
  private userData: { identifier?: string; password?: string; name?: string; email?: string; countryCode?: string; phoneNumber?: string; address?: string; confirmPassword?: string } = {};
  constructor(private router: Router, private tts: ResponsiveVoiceService) {}



  
  async initializeVoiceCommands(
    loginForm?: FormGroup,
    loginComponent?: LoginComponent,
    registerForm?: FormGroup,
    registerComponent?: RegisterComponent
  ): Promise<void> {
    try {
      if (!annyang) {
        console.error('❌ Annyang is not supported in this browser.');
        return;
      }
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permissionStatus.state !== 'granted') {
        console.warn('⚠️ Microphone permission not granted.');
        return;
      }
      
      console.log('✅ Annyang is active! Say "Hello" to wake up.');
  
      if (loginForm && loginComponent) {
        this.loginForm = loginForm;
        this.loginComponent = loginComponent;
      }
  
      if (registerForm && registerComponent) {
        this.registerForm = registerForm;
        this.registerComponent = registerComponent;
    }
    
  
      const commands: { [key: string]: (input?: string) => void } = {
        'hello': () => this.startListening(),
        'hello bank': () => this.startListening(),
        '*input': (input?: string) => this.handleInput(input),
      };
  
      annyang.addCommands(commands);
      annyang.start({ autoRestart: true, continuous: true });
    } catch (error) {
      console.error('❌ Error initializing voice commands:', error);
      this.speak('An error occurred while setting up voice commands.');
    }
  }
  

  private startListening(): void {
    if (!this.isListening) {
      this.isListening = true;
      console.log('🎤 Voice assistant activated.');
      speechSynthesis.resume();
      this.speak('How can I help you?');
    }
  }
  private navigateToHome(): void {
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
      this.speak('Redirecting to create account page. Please say your full name.');
      this.step = 4;
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
    try {
      console.log("🔍 Recognized voice input:", input);
  
      if (!this.isListening || !input) {
        console.warn('⚠️ Voice command received invalid input:', input);
        return;
      }
  
      input = input.trim().toLowerCase();
  
      const keywordActions: { [key: string]: () => void } = {
        "index": () => this.navigateToHome(),
        "home": () => this.navigateToHome(),
        "login": () => this.navigateToLogin(),
        "sign in": () => this.navigateToLogin(),
        "create account": () => this.navigateToRegister(),
        "register": () => this.navigateToRegister(),
        "sign up": () => this.navigateToRegister(),
        "logout": () => this.logout(),
        "exit": () => this.logout(),
        "stop": () => this.stopListening()
      };
  
      for (const keyword in keywordActions) {
        if (input.includes(keyword)) {
          console.log(`✅ Matched keyword: "${keyword}"`);
          keywordActions[keyword]();
          return;
        }
      }
  
      this.processLoginOrRegister(input);
    } catch (error) {
      console.error('❌ Error processing voice input:', error);
      this.speak('An error occurred while processing your voice input.');
    }
  }
  
  private processLoginOrRegister(input: string): void {
    
    if (this.router.url.includes('login')) {
      this.processLogin(input);
    } else if (this.router.url.includes('register')) {
      this.processRegister(input);
    }
  }

  private processLogin(input: string): void {
    if (!input.trim()) {
        this.speak('Input not recognized. Please try again.');
        return;
    }

    if (this.step === 1) {
        this.userData.identifier = input;
        this.updateInputField('identifier', input);
        this.speak(`You said ${input}. Now, please say your password.`);
        this.step = 2;
        this.updateForm(this.loginForm);
    } else if (this.step === 2) {
        if (!input.trim()) {
            this.speak('Password cannot be empty. Please say your password again.');
            return;
        }
        this.userData.password = input;
        this.updateInputField('password', this.userData.password);
        this.speak('Password received. Say "confirm" to login.');
        this.step = 3;
        this.updateForm(this.loginForm);
    } else if (this.step === 3 && input.toLowerCase() === 'confirm') {
        if (!this.loginForm || !this.loginComponent) {
            console.error('❌ Login form or component is not initialized.');
            this.speak('Login form is not available.');
            return;
        }

        this.loginForm.setValue({
            identifier: this.userData.identifier?.trim(),
            password: this.userData.password?.trim()
        });

        this.speak('Logging in now.');
        this.loader?.hide();

        this.loginComponent.onSubmit();
        this.resetState();
    }
}
private processRegister(input: string): void {
  if (!input.trim()) {
      this.speak('Input not recognized. Please try again.');
      return;
  }

  switch (this.step) {
      case 4:
          this.userData.name = input;
          this.updateInputField('name', input);
          this.speak(`You said ${input}. Now, please say your email.`);
          this.step = 5;
          this.updateForm(this.registerForm);
          break;
      case 5:
          if (!input.trim()) {
              this.speak('Email cannot be empty. Please say your email again.');
              return;
          }
          this.userData.email = input;
          this.updateInputField('email', input);
          this.speak(`You said ${input}. Now, please say your country code.`);
          this.step = 6;
          this.updateForm(this.registerForm);
          break;
          case 6: // Country Code Step
            if (!input.trim()) {
                this.speak('Country code cannot be empty. Please say your country code again.');
                return;
            }

            const countryList = this.getCountryList(); // Get the available countries
            const matchedCountry = this.findCountryMatch(input, countryList);

            if (matchedCountry) {
                this.userData.countryCode = matchedCountry.code;
                this.updateInputField('countryCode', matchedCountry.code);
                this.speak(`You selected ${matchedCountry.name}. Now, please say your phone number.`);
                this.step = 7;
            } else {
                this.speak('Invalid country code or name. Please say a valid country name or code.');
            }

            this.updateForm(this.registerForm);
            break;
      case 7:
          if (!input.trim()) {
              this.speak('Phone number cannot be empty. Please say your phone number again.');
              return;
          }
          this.userData.phoneNumber = input;
          this.updateInputField('phoneNumber', input);
          this.speak(`You said ${input}. Now, please say your address.`);
          this.step = 8;
          this.updateForm(this.registerForm);
          break;
      case 8:
          if (!input.trim()) {
              this.speak('Address cannot be empty. Please say your address again.');
              return;
          }
          this.userData.address = input;
          this.updateInputField('address', input);
          this.speak(`You said ${input}. Now, please say your password.`);
          this.step = 9;
          this.updateForm(this.registerForm);
          break;
      case 9:
          if (!input.trim()) {
              this.speak('Password cannot be empty. Please say your password again.');
              return;
          }
          this.userData.password = input;
          this.updateInputField('password', input);
          this.speak('Password received. Now, please confirm your password.');
          this.step = 10;
          this.updateForm(this.registerForm);
          break;
      case 10:
          if (!input.trim()) {
              this.speak('Confirm password cannot be empty. Please confirm your password again.');
              return;
          }
          this.userData.confirmPassword = input;
          this.updateInputField('confirmPassword', input);
          this.speak('Confirm password received. Say "confirm" to complete registration.');
          this.step = 11;
          this.updateForm(this.registerForm);
          break;
      case 11:
          if (input.toLowerCase() === 'confirm') {
              if (!this.registerForm || !this.registerComponent) {
                  console.error('❌ Register form or component is not initialized.');
                  this.speak('Registration form is not available.');
                  return;
              }

              this.registerForm.setValue({
                  name: this.userData.name?.trim(),
                  email: this.userData.email?.trim(),
                  countryCode: this.userData.countryCode?.trim(),
                  phoneNumber: this.userData.phoneNumber?.trim(),
                  address: this.userData.address?.trim(),
                  password: this.userData.password?.trim(),
                  confirmPassword: this.userData.confirmPassword?.trim()
              });

              if (this.registerComponent && typeof this.registerComponent.onSubmit === 'function') {
                  this.speak('Registering now.');
                  this.loader?.hide();

                  this.registerComponent.onSubmit();
                  this.resetState();
              } else {
                  console.error('❌ Register component not initialized.');
                  this.speak('Registration failed. Please try again.');
              }
          } else {
              this.speak('Please say "confirm" to proceed with registration.');
          }
          break;
      default:
          this.speak('Unexpected step. Please restart the registration.');
          this.processRegister(input);
  }
}

private getCountryList(): { name: string; code: string }[] {
  return [
      { name: 'India', code: '+91' },
      { name: 'United States', code: '+1' },
      { name: 'United Kingdom', code: '+44' },
      { name: 'Canada', code: '+1' },
      { name: 'Australia', code: '+61' },
      { name: 'Germany', code: '+49' },
      { name: 'France', code: '+33' },
      { name: 'Japan', code: '+81' },
      { name: 'China', code: '+86' },
      { name: 'Brazil', code: '+55' }
      // Add more countries as needed
  ];
}

/**
* Finds a country match based on user input.
*/
private findCountryMatch(input: string, countryList: { name: string; code: string }[]): { name: string; code: string } | null {
  const lowerInput = input.trim().toLowerCase();
  return countryList.find(country =>
      country.name.toLowerCase().includes(lowerInput) || country.code.includes(lowerInput)
  ) || null;
}



private updateInputField(fieldName: string, value: string): void {
    try {
        const trimmedValue = value.trim();
        if (this.registerForm && this.registerForm.controls[fieldName]) {
            this.registerForm.controls[fieldName].setValue(trimmedValue);
            console.log(`✅ Updated field "${fieldName}" with value: ${trimmedValue}`);
        } else {
            console.warn(`⚠️ Form or field "${fieldName}" not found.`);
        }
    } catch (error) {
        console.error(`❌ Error updating field "${fieldName}":`, error);
        this.speak('An error occurred while updating form fields.');
    }
}

  
  private updateForm(form?: FormGroup): void {
    if (form) {
      form.setValue({
        identifier: this.userData.identifier || '',
        password: this.userData.password || '',
        name: this.userData.name || '',
        email: this.userData.email || '',
        countryCode: this.userData.countryCode || '',
        phoneNumber: this.userData.phoneNumber || '',
        address: this.userData.address || '',
        confirmPassword: this.userData.confirmPassword || ''
      });
    }
  }


  private speak(message: string): void {
    try {
      this.tts.speak(message);
    } catch (error) {
      console.error('❌ Error in text-to-speech:', error);
    }
  }
  

  private resetState(): void {
    this.isListening = false;
    this.startListening();
    this.userData = {};
  }
}
