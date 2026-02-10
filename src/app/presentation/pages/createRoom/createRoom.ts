import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-create-room',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './createRoom.html',
  styleUrls: ['./createRoom.css']
})
export class CreateRoomComponent {
  
}
