package functions

import (
	"fmt"
	ics "github.com/arran4/golang-ical"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	_ "time/tzdata"
)

type Task struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Date        string `json:"date"`
}

func ProcessCalanderData() {
	tasks, err := fetchCalendarData()
	if err != nil {
		fmt.Println(err)
		return
	}

	var userIdString = os.Getenv("userIdWebcall")
	userId, err := strconv.Atoi(userIdString)
	if err != nil {
		fmt.Errorf("userIdWebcall is not defined or not a number")
		return
	}

	for _, task := range tasks {
		fmt.Println(task)
		if !taskExistsInDB(task, userId) {
			insertTaskIntoDB(task, userId)
		}
	}
}

func fetchCalendarData() ([]Task, error) {
	url := os.Getenv("webcallCHEagenda")
	url = strings.Replace(url, "webcal", "https", 1)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Parseren van ICS-bestand
	calendar, err := ics.ParseCalendar(resp.Body)
	if err != nil {
		return nil, err
	}

	var tasks []Task
	loc, error := time.LoadLocation("Europe/Amsterdam")
	if error != nil {
		return nil, error
	}
	for _, event := range calendar.Events() {
		start, _ := time.ParseInLocation("20060102T150405", event.GetProperty(ics.ComponentPropertyDtStart).Value, loc)
		end, _ := time.ParseInLocation("20060102T150405", event.GetProperty(ics.ComponentPropertyDtEnd).Value, loc)

		title := event.GetProperty(ics.ComponentPropertySummary).Value
		title = strings.Replace(title, "\\", "", -1)
		title = strings.Split(title, ",")[0]

		description := start.Format("15:04") + " - " + end.Format("15:04")
		location := event.GetProperty(ics.ComponentPropertyLocation).Value
		location = strings.Replace(location, "@", "", -1)
		location = strings.Replace(location, "\\", "", -1)
		description = description + "\n" + location

		tasks = append(tasks, Task{
			Title:       title,
			Description: description,
			Date:        start.Format("2006-01-02"),
		})
	}

	return tasks, nil
}

func taskExistsInDB(task Task, userId int) bool {
	dbConnection, err := GetDatabaseConnection()
	if err != nil {
		panic(err.Error())
	}
	defer dbConnection.Close()

	query := "SELECT COUNT(*) FROM todos WHERE title = ? AND description = ? AND date = ? AND userId = ? AND isCHEagenda = true;"
	result, err := dbConnection.Query(query, task.Title, task.Description, task.Date, userId)
	if err != nil {
		panic(err.Error())
	}
	defer result.Close()

	var count int
	for result.Next() {
		err := result.Scan(&count)
		if err != nil {
			panic(err.Error())
		}
	}

	return count > 0
}

func insertTaskIntoDB(task Task, userId int) {
	dbConnection, err := GetDatabaseConnection()
	if err != nil {
		panic(err.Error())
	}
	defer dbConnection.Close()

	query := "SELECT COUNT(*) FROM todos WHERE date = ? AND userId = ?;"
	result, err := dbConnection.Query(query, task.Date, userId)
	if err != nil {
		panic(err.Error())
	}
	defer result.Close()

	var todoOrder int
	for result.Next() {
		err := result.Scan(&todoOrder)
		if err != nil {
			panic(err.Error())
		}
	}

	todoOrder = todoOrder + 1

	queryInsert := "call insertAtodoTask(?, ?, ?, true, ?);"
	_, err = dbConnection.Query(queryInsert, task.Title, task.Description, task.Date, userId)
	if err != nil {
		panic(err.Error())
	}
}
