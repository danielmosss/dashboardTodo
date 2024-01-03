import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { DataService } from 'src/data.service';
import { MatDialog } from '@angular/material/dialog';
import { CardpopupComponent } from '../../popups/cardpopup/cardpopup.component';
import { CreateTodoComponent } from '../../popups/create-todo/create-todo.component';
import { DayTodo, Todo } from '../../interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadjsonComponent } from '../../popups/uploadjson/uploadjson.component';
const timer = (ms: any) => new Promise(res => setTimeout(res, ms))
import * as moment from 'moment';


@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  public connectedLists: any[] = [];
  public Todolist: DayTodo[] = [];
  public updatedList: Todo[] = [];
  public deletedList: Todo[] = [];
  public dateRange: { start: string, end: string };

  public loading: boolean = false;
  public username = this._dateservice.getUsername();

  public showCheckedItems: boolean = false;

  public viewAccountSettings: boolean = false;

  constructor(private _dateservice: DataService, private _dialog: MatDialog, private _snackbar: MatSnackBar) { }

  ngOnInit(): void {
    this.getTodoTasks();
  }

  logout() {
    this._dateservice.logout();
    this._snackbar.open("Logged out", '', { duration: 3000, horizontalPosition: 'left', panelClass: 'success' });
  }

  openJsonuploader(){
    var dialog = this._dialog.open(UploadjsonComponent)
    dialog.afterClosed().subscribe((data?: Todo[]) => {
      if (!data) return;
      this.getTodoTasks();
    })
  }

  isMobile(){
    return this._dateservice.isMobile();
  }

  getTodoTasks() {
    if (this.dateRange) this._dateservice.getTodoByDateRange(this.dateRange).subscribe(data => { this.handleGetTodos(data); })
    else this._dateservice.getTodo().subscribe(data => { this.handleGetTodos(data); })
  }

  async handleGetTodos(data: DayTodo[]) {
    if (this.Todolist.length > 0) {
      data.forEach(async (item, index) => {
        this.Todolist[index] = item;
        this.connectedLists[index] = `${item.day}List`;
      })
    } else {
      this.Todolist = data;
      this.connectedLists = this.Todolist.map(d => `${d.day}List`);
    }

    await timer(1000);
    this.loading = false;
  }

  getDayName(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);

      const list = event.container.data;
      list.forEach(async (item, index) => {
        item.todoOrder = index + 1;
        await this.updateTodoList(item);
      })
    } else {
      let containerID = event.container.id;
      let containerDay = containerID.split("List")[0];
      let containerDate = this.Todolist.find(d => d.day === containerDay)?.date;
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);

      const list = event.container.data;
      list.forEach(async (item, index) => {
        item.todoOrder = index + 1;
        item.date = containerDate;
        await this.updateTodoList(item);
      })

      const previousList = event.previousContainer.data;
      previousList.forEach(async (item, index) => {
        item.todoOrder = index + 1;
        await this.updateTodoList(item);
      })
    }

    this._dateservice.putTodoList(this.updatedList).subscribe(data => {
      this.getTodoTasks();
      this.updatedList = [];
    })
  }


  async updateTodoList(itemToUpdate: Todo) {
    const index = this.updatedList.findIndex(item => item.id === itemToUpdate.id);
    if (index !== -1) this.updatedList[index] = itemToUpdate;
    else this.updatedList.push(itemToUpdate);
  }

  openCardInfo(todo: Todo) {
    var dialog = this._dialog.open(CardpopupComponent, {
      data: todo
    })
    dialog.afterClosed().subscribe((data?: Todo) => {
      if (!data) return;
      if (data.deleted) {
        var index = this.Todolist.findIndex(d => d.date === data.date);
        var todoIndex = this.Todolist[index].tasks.findIndex(t => t.id === data.id);
        this.Todolist[index].tasks.splice(todoIndex, 1);
      }
      else if (!data.deleted) {
        var index = this.Todolist.findIndex(d => d.date === data.date);
        var todoIndex = this.Todolist[index].tasks.findIndex(t => t.id === data.id);
        this.Todolist[index].tasks[todoIndex] = data;
      }
    })
  }

  openCardCreate() {
    var dialog = this._dialog.open(CreateTodoComponent)
    dialog.afterClosed().subscribe((data?: Todo) => {
      if (!data) return;
      var index = this.Todolist.findIndex(d => d.date === data.date);
      this.Todolist[index].tasks.push(data);
    })
  }

  handleDateSelection(dateRange: { start: string, end: string }) {
    this.loading = true;
    this.dateRange = dateRange;
    this.getTodoTasks();
  }

  getCheckItemsForDay(day: DayTodo) {
    return day.tasks.filter(t => t.checked).length
  }
}
