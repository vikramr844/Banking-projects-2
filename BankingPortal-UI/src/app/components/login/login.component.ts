import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from 'angular-toastify';
import { AuthService } from 'src/app/services/auth.service';
import { LoadermodelService } from 'src/app/services/loadermodel.service';
import { VoiceService } from 'src/app/services/voice.service';
import { environment } from 'src/environment/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword: boolean = false;
  authTokenName = environment.tokenName;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private _toastService: ToastService,
    private loader: LoadermodelService,
    private voiceService: VoiceService
  ) {}

  ngOnInit(): void {
    this.initLoginForm();
  }

  initLoginForm(): void {
    sessionStorage.clear();
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    // Initialize voice control with login form
    this.voiceService.initializeVoiceCommands(this.loginForm);
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { identifier, password } = this.loginForm.value;
      this.loader.show('Logging in...');

      this.authService.login(identifier, password).subscribe({
        next: (response: any) => {
          const token = response.token;
          localStorage.setItem(this.authTokenName, token);
          this.loader.hide();
          this.router.navigate(['/dashboard']);
        },
        error: (error: any) => {
          this._toastService.error(error.error);
          console.error('Login error:', error);
          this.loader.hide();
        },
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
