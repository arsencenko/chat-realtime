import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import TypingIndicator from './TypingIndicator';
import { MentionsInput, Mention } from "react-mentions";

import '../App.css';

const insertMessage = gql`
  mutation insert_message ($message: message_insert_input! ){
    insert_message (
      objects: [$message]
    ) {
      returning {
        id
        timestamp
        text
        username
      }
    }
  }
`;

const getUsers = gql`
  query user{
    user{
      id
      username
    }
  }
`;

const emitTypingEvent = gql`
  mutation ($userId: Int) {
    update_user (
      _set: {
        last_typed: "now()"
      }
      where: {
        id: {
          _eq: $userId
        }
      }
    ) {
      affected_rows
    }
  }
`;

export default class Textbox extends React.Component {

  constructor(props) {
    super()
    this.state = {
      text: "",
      users: []
    }
  }

  handleTyping = (text, mutate) => {
    const textLength = text.length;
    if ((textLength !== 0 && textLength % 5 === 0) || textLength === 1) {
      this.emitTypingEvent(mutate);
    }
    this.setState({ text });
  }

  emitTypingEvent = async (mutate) => {
    if (this.props.userId) {
      await mutate({
        mutation: emitTypingEvent,
        variables: {
          userId: this.props.userId
        }
      });
    }
  }

  componentDidMount(){
    this.props.client.query({
      query: getUsers,
    }).then((result) => {
      var res = result.data.user.map(x => {
        return {
          id: x.id,
          display: x.username
        }
      }).filter(x => x.id != this.props.userId);
      this.setState({
        ...this.state,
        users: res
      })
    })
  };

  render() {
    // Mutation component. Add message to the state of <RenderMessages> after mutation.
    return (
      <Mutation
        mutation={insertMessage}
        variables={{
          message: {
            username: this.props.username,
            text: this.state.text
          }
        }}
        update={(cache, { data: { insert_message }}) => {
          this.props.mutationCallback(
            {
              id: insert_message.returning[0].id,
              timestamp: insert_message.returning[0].timestamp,
              username: insert_message.returning[0].username,
              text: insert_message.returning[0].text,
            }
          );
        }}
      >
        {
          (insert_message, { data, loading, error, client}) => {
            const sendMessage = (e) => {
              e.preventDefault();
              insert_message();
              this.setState({
                text: ""
              });
            }
            return this.form(sendMessage, client, this.state.users);
          }
        }

      </Mutation>
    )
  }

  form = (sendMessage, client, users) => {
    return (
      <form onSubmit={sendMessage}>
        <div className="textboxWrapper">
          <TypingIndicator userId={this.props.userId} />
          <MentionsInput
            className="textbox typoTextbox"
            markup="@[__username__](__id__)"
            value={this.state.text}
            onChange={(e) => {
              this.handleTyping(e.target.value, client.mutate);
            }}
          >
            <Mention trigger="@" data={users} />
          </MentionsInput>
          <button
            className="sendButton typoButton"
            onClick={sendMessage}
          > Send </button>
        </div>
      </form>
    );
  }
}
