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
                        background: rgba(255,255,255, 0.2);
                        padding-left: 5px;
                        padding-right: 5px;
                        color: white;
                        font-weight: bold;
                        border-bottom-right-radius: 4px;
                        font-size: 9px;
                    }
                `}
                </style>
            </div>

        );
    }
}
