import React from 'react';
import '../App.css';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

const updateUser = gql`
  mutation ($username: String!, $lastseen: timestamptz!){
    update_user(where: {username: {_eq: $username}}, _set: {last_seen: $lastseen}){
      returning{
        id
        username
      }
    }
  } 
`;

const LoginComponent = (props) => {
  return (
    <div className="loginWrapper">
      <h2 className="loginHeading"> Welcome to sample chat app made with Hasura GraphQL Engine </h2>
      <div className="login">
        <Mutation
          mutation={updateUser}
          variables={{
            username: props.username,
            lastseen: new Date().toISOString()
          }}
          onCompleted={(data) => {
            if(data.update_user.returning.length == 0){
              return;
            } else {
              props.login(data.update_user.returning[0].id);
            }
          }}
          onError={(err) => {
            props.setUsername('');
          }}
        >
          {
            (update_user, { data, error, loading}) => {
              if (loading) { return "Loading"; }
              const errorMessage = error ? 
                  <div className="errorMessage"> Try again with a different username </div> :
                  null;
              return (
                <div>
                  { errorMessage}
                  <form>
                    <input
                      type="text"
                      id="username"
                      className="loginTextbox"
                      placeholder="Username"
                      autoFocus={true}
                      value={props.username}
                      onChange={(e) => props.setUsername(e.target.value)}
                    />
                    <button
                      className="loginButton"
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        if (props.username.match(/^[a-z0-9_-]{3,15}$/g)) {
                          update_user();
                        } else {
                          alert("Invalid username. Spaces and special characters not allowed. Please try again");
                          props.setUsername('');
                        }
                      }}
                    >
                      Enter
                    </button>
                  </form>
                </div>
              );
            }
          }
        </Mutation>
      </div>
    </div>
  );
};

export default LoginComponent;
