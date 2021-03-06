var Habit = React.createClass({ // 
  render: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return (
      <div className="habit">
      <h2 className="user_id">{this.props.user_id}</h2>
      <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
      </div>
      );
  }
});

var ProfileAddDisplayHab = React.createClass({ // parent component
  loadHabitsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url);
        console.error(status);
        console.log(err.toString());
      }.bind(this)
    });
  },

  handleHabitSubmit: function(habitCategory) { // this is fired from the render function of this component
  // the argument, "habitCategory ", is the data submitted (value of the text-field AND the dropdown menu) by user that will be sent to the server via POST request
    var habits = this.state.data; // state of the data before the new habit is added
    var newHabits = habits.concat([habitCategory]); // add the new data to the data object
    this.setState({data: newHabits}); // re-set the state to include both the old and new data
    console.log('*************', habitCategory);

    // in the dollowing AJAX object, the data is set to the value of the new object that is submitted by the user
    $.ajax({
      url: '/api/habits',
      dataType: 'json',
      type: 'POST',
      data: habitCategory,
      success: function(data) {
        this.setState({data: data}); 
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadHabitsFromServer();
    setInterval(this.loadHabitsFromServer, this.props.pollInterval); // retrieves habits from db on interval
  },
  render: function() {
    return (
      <div className="habitBox">
      <h1>Habit Tracker</h1>
      <HabitList data={this.state.data} />
      <HabitForm onHabitSubmit={this.handleHabitSubmit} />
      </div>
      );
  }
});

var HabitList = React.createClass({ // updates the habits db with new entry and maps over the entire list of habits and displays to page

  updateHabit: function(habit, update){
    $.ajax({
      url: '/api/updateHabit',
      type: 'POST',
      data: habit,
      dataType: 'json',
      success: function(data) {
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

  },

  deleteHabit: function(habit) {
    $.ajax({
      url: '/api/deleteHabit',
      type: 'DELETE',
      data: habit,
      dataType: 'json',
      success: function(data) {
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  render: function() {

    var habitNodes = this.props.data.map(function(habit, index) {
      if (habit.count === undefined) {
        habit.count = 0;
      }
      return (
        <table><tbody>
          <tr>
            <td><button type="submit" formMethod="post" onClick={this.updateHabit.bind(this, habit)}>Check-in</button></td>
            <td><Habit user_id={habit.user_id} key={index}>
              {habit.habit+' '+(habit.count-1)} 
              </Habit>
            </td>
            <td><button type="button" className="btn btn-xs btn-danger" formmethod="post" onClick={this.deleteHabit.bind(this, habit)}>DELETEME</button>
            </td>
          </tr>
        </tbody></table>
        );
    }.bind(this));
    return (
      <div className="HabitList">{habitNodes}</div>
      );
  }
});

var HabitForm = React.createClass({ // form to enter new habits
  handleSubmit: function(e) {
    e.preventDefault();
    // Both habit and category are the 2 pieces of info being sent in the handleSubmit function, they are referenced here with this.refs, which refer to the values of the DOM element that have a ref-attribute of "habit" and "category"
    var habit = React.findDOMNode(this.refs.habit).value.trim();
    var category = React.findDOMNode(this.refs.category).value.trim();
    if (!habit) {
      return;
    }
    this.props.onHabitSubmit({habit: habit, category: category}); // with every new habit object, it will have 2 key-val pairs; one for the habit-string and one string from the category dropdown menu
    React.findDOMNode(this.refs.habit).value = '';
  },

  render: function() {
    return (
      <form className="habitForm" onSubmit={this.handleSubmit}>
      <input type="text" placeholder="Enter text" ref="habit" />
      <div>
        <select name="Categories" id='something' ref="category">
        <option value="null">Please select a category for your new Habitude</option>
          <option value="Health">Health</option>
          <option value="Fitness">Fitness</option>
          <option value="Addiction">Addiction</option>
          <option value="Overall Cool Catness">Overall Cool Catness</option>
        </select>
      </div>
      <input type="submit" value="Post" />
      </form>
      );
  }
});

React.render(<ProfileAddDisplayHab url={'/api/updateHabit'} pollInterval={500} categories={['Fitness', 'Education', 'Addiction', 'Overall Cool Catness']} habitsObj={{}}/>, document.getElementById("adddisplayhab"));

