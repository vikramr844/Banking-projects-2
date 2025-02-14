import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { VoiceService } from './voice.service';

declare var annyang: any;

describe('VoiceService', () => {
  let service: VoiceService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSpeak: jasmine.Spy;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        VoiceService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(VoiceService);

    // Spy on the speak function to prevent actual speech output
    mockSpeak = spyOn<any>(service, 'speak').and.callFake((msg: string) => console.log(`Mock Speak: ${msg}`));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize voice commands', () => {
    spyOn(console, 'error');
    spyOn(console, 'log');

    service.initializeVoiceCommands();

    if (typeof annyang === 'undefined' || !annyang) {
      expect(console.error).toHaveBeenCalledWith('❌ Annyang is not supported in this browser.');
    } else {
      expect(console.log).toHaveBeenCalledWith('✅ Annyang is active! Say "Hey Bank" to wake up.');
    }
  });

  it('should start listening when user says "Hey Bank"', () => {
    service['isListening'] = false; // Ensure it's initially false
    service['startListening']();

    expect(service['isListening']).toBeTrue();
    expect(mockSpeak).toHaveBeenCalledWith('How can I help you?');
  });

  it('should navigate to login when user says "Login"', () => {
    service['isListening'] = true;
    service['navigateToLogin']();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(mockSpeak).toHaveBeenCalledWith('Redirecting to login page. Please say your email or account number.');
    expect(service['step']).toBe(1);
  });

  it('should handle user input for identifier and password', () => {
    service['isListening'] = true;
    
    service['handleInput']('testuser@example.com');
    expect(service['loginData'].identifier).toBe('testuser@example.com');
    expect(mockSpeak).toHaveBeenCalledWith('You said testuser@example.com. Now, please say your password.');
    expect(service['step']).toBe(2);

    service['handleInput']('securepassword');
    expect(service['loginData'].password).toBe('securepassword');
    expect(mockSpeak).toHaveBeenCalledWith('Password received. Say "confirm" to login.');
    expect(service['step']).toBe(3);
  });

  it('should submit login form when user says "Confirm"', () => {
    const mockLoginForm = new FormGroup({
      identifier: new FormControl(''),
      password: new FormControl(''),
    });

    service.initializeVoiceCommands(mockLoginForm);
    service['isListening'] = true;
    service['step'] = 3;
    service['loginData'] = { identifier: 'testuser@example.com', password: 'securepassword' };

    service['handleInput']('confirm');

    expect(mockLoginForm.value).toEqual({ identifier: 'testuser@example.com', password: 'securepassword' });
    expect(mockSpeak).toHaveBeenCalledWith('Logging in now.');
    expect(service['isListening']).toBeFalse();
    expect(service['step']).toBe(0);
  });

  it('should handle invalid input', () => {
    service['isListening'] = true;
    service['handleInput']('random text');

    expect(mockSpeak).toHaveBeenCalledWith('I did not understand. Please try again.');
  });
});
