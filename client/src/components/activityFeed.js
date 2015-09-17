var Counter = React.createClass({ // child component, see https://scotch.io/tutorials/learning-react-getting-started-and-concepts for more info
  incrementCount: function(){
    this.setState({
      count: this.state.count + 1
    });
  },
  getInitialState: function(){
     return {
       count: 0
     }
  },
  render: function(){
    return (
      <div className="count">
        <p>with {this.state.count} kudos</p>
        <button type="button" onClick={this.incrementCount}>ThumbsUp</button>
      </div>
    );
  }
});

var ActivityFeed = React.createClass({ //parent component

  loadActivitiesFromServer: function() { //loads data for the activity feed
    $.ajax({
      url: '/api/activityFeed',
      dataType: 'json',
      cache: false,
      success: function(data) {
        console.log('success from the load activities DATA', data);
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  giveKudos: function(updateID){ // method gets fired on button-click
    console.log('updateID',updateID)
    $.ajax({
      type: 'POST',   // PUT request to update kudos_count value in the db
      data: updateID,
      dataType: 'json',
      url: '/api/giveKudos',
      success: function(updateID) { // IDK why no success msg sent but in console success message from db-query
        console.log('data',updateID)
        // this.setState({data:data})
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() { // initial state is empty until our get request returns with the data
    return {data: []};
  },
  componentDidMount: function() { // this method fires before the intitial render
    this.loadActivitiesFromServer();
  },
  render: function() {
    var activityNodes = this.state.data.map(function(activity,i,list){ //iterating thru array of objects returned from db query, and gives each activity its own kudos button
      return (
      
          <table><tbody>
            <tr>
              <td>{activity.username+': '+activity.habit+' at '+activity.update_time}</td>
              <td><Counter/></td>
            </tr>
          </tbody></table>
       );
    }.bind(this));
    return (
      <div className="ActivityFeed"><h1>Activity Feed</h1>{activityNodes}</div>  
    );
  }
})

React.render(<ActivityFeed />, document.getElementById('activityfeed'))

/*************************************************
IF KUDOS BUTTON IS BETTER OFF AS ITS OWN COMPONENT, 
SAVED IT HERE IN CASE IT NEEDS TO BE REFACTORED IN
:)
*************************************************/
// var KudosButton = React.createClass({
// 		giveKudos: function(updateID){ // method gets fires on button-click
//       console.log('updateID',updateID)
// 		$.ajax({
//       url: '/api/giveKudos',
//       type: 'POST',   // PUT request to update kudos_count value in the db
//       contentType: 'application/json',
//       dataType: 'json',
//       success: function(data) { // IDK why no success msg sent but in console success message from db-query
//       	this.setState({data:data})
//         console.log('successful thumbs up')
//       }.bind(this),
//       error: function(xhr, status, err) {
//         console.error(this.props.url, status, err.toString());
//       }.bind(this)
//     });
// 	},

// 	render: function(){
//     console.log('what is this',this)
//     return (
//     	<div >
// 	  		<button type="submit" onClick={this.giveKudos.bind(activity)}>THUMBS UP</button>
//       </div>
//     ) 
//   }
// })