import React, { Component } from 'react';
import OpenViduVideoComponent from './OvVideo';

export default class UserVideoComponent extends Component {

    getNicknameTag() {
        // Gets the nickName of the user
        return JSON.parse(this.props.streamManager.stream.connection.data).clientData;
    }

    render() {
        return (
            <div>
                {this.props.streamManager !== undefined ? (
                    <div className="streamcomponent">
                        <OpenViduVideoComponent streamManager={this.props.streamManager} />
                        <div className="user-name">{this.getNicknameTag()}</div>
                    </div>
                ) : null}
                <style jsx>{`
                .streamcomponent {
                    position: relative;
                }
                .streamcomponent .user-name {
                    top: 0;
                    position: absolute;
                    background: #f8f8f8;
                    padding-left: 5px;
                    padding-right: 5px;
                    color: #777777;
                    font-weight: bold;
                    border-bottom-right-radius: 4px;
                }
                `}
                </style>
            </div>

        );
    }
}
