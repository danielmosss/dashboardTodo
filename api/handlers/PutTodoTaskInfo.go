package handlers

import (
	"api/functions"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

func PutTodoTaskInfo(res http.ResponseWriter, req *http.Request) {
	fmt.Println("PutTodoTaskInfo called")

	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		http.Error(res, err.Error(), http.StatusInternalServerError)
		return
	}

	var newTask todoCard
	if err := json.Unmarshal(body, &newTask); err != nil {
		http.Error(res, err.Error(), http.StatusInternalServerError)
		return
	}

	dbConnection, err := functions.GetDatabaseConnection()
	if err != nil {
		http.Error(res, err.Error(), http.StatusInternalServerError)
		return
	}

	userId, err := functions.GetUserID(req)
	if err != nil {
		http.Error(res, err.Error(), http.StatusUnauthorized)
		return
	}

	query := "UPDATE todos SET title = ?, description = ? WHERE id = ? AND userId = ?;"
	result, err := dbConnection.Query(query, newTask.Title, newTask.Description, newTask.Id, userId)
	if err != nil {
		http.Error(res, err.Error(), http.StatusInternalServerError)
		return
	}
	defer result.Close()
	defer dbConnection.Close()
}
