import { Component, OnInit } from '@angular/core';
import { VoiceService } from './services/voice.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'BankingPortal';

  constructor(private voiceService: VoiceService) {}

  ngOnInit(): void {
    this.voiceService.initializeVoiceCommands(); // Activate voice commands
  }
}
