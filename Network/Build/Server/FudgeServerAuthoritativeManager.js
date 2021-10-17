import * as FudgeNetwork from "../ModuleCollectorServer.js";
export class FudgeServerAuthoritativeManager {
    // tslint:disable-next-line: no-any
    signalingServer;
    authServerPeerConnectedClientCollection = new Array();
    peerConnectionBufferCollection = new Array();
    divAndPlayerMap = new Array();
    movementSpeed = 3;
    // tslint:disable-next-line: typedef
    configuration = {
        iceServers: [
            { urls: "stun:stun2.1.google.com:19302" },
            { urls: "stun:stun.example.com" }
        ]
    };
    constructor() {
        console.log("AuthoritativeServerStartet");
    }
    collectClientCreatePeerConnectionAndCreateOffer = (_freshlyConnectedClient) => {
        let newPeerConnection = new RTCPeerConnection(this.configuration);
        newPeerConnection.addEventListener("icecandidate", this.sendNewIceCandidatesToPeer);
        _freshlyConnectedClient.rtcPeerConnection = newPeerConnection;
        this.authServerPeerConnectedClientCollection.push(_freshlyConnectedClient);
        this.initiateConnectionByCreatingDataChannelAndCreatingOffer(_freshlyConnectedClient);
        this.addMovingDivForClient(_freshlyConnectedClient.id);
    };
    createID = () => {
        // Math.random should be random enough because of it's seed
        // convert to base 36 and pick the first few digits after comma
        return "_" + Math.random().toString(36).substr(2, 7);
    };
    addIceCandidateToServerConnection = async (_receivedIceMessage) => {
        if (_receivedIceMessage.candidate) {
            let client = this.searchUserByUserIdAndReturnUser(_receivedIceMessage.originatorId, this.authServerPeerConnectedClientCollection);
            console.log("server received candidates from: ", client);
            await client.rtcPeerConnection.addIceCandidate(_receivedIceMessage.candidate);
        }
    };
    parseMessageToJson = (_messageToParse) => {
        let parsedMessage = { originatorId: " ", messageType: FudgeNetwork.MESSAGE_TYPE.UNDEFINED };
        try {
            parsedMessage = JSON.parse(_messageToParse);
        }
        catch (error) {
            console.error("Invalid JSON", error);
        }
        return parsedMessage;
    };
    // tslint:disable-next-line: no-any
    receiveAnswerAndSetRemoteDescription = (_websocketClient, _answer) => {
        console.log("Received answer");
        let clientToConnect = this.searchUserByWebsocketConnectionAndReturnUser(_websocketClient, this.authServerPeerConnectedClientCollection);
        console.log(clientToConnect);
        let descriptionAnswer = new RTCSessionDescription(_answer.answer);
        clientToConnect.rtcPeerConnection.setRemoteDescription(descriptionAnswer);
        console.log("Remote Description set");
    };
    broadcastMessageToAllConnectedClients = (_messageToBroadcast) => {
        this.authServerPeerConnectedClientCollection.forEach(client => {
            if (client.rtcDataChannel.readyState == "open") {
                client.rtcDataChannel.send(_messageToBroadcast);
            }
            else {
                console.error("Connection closed abnormally for: ", client);
            }
        });
    };
    // TODO Use or delete
    // tslint:disable-next-line: no-any
    sendNewIceCandidatesToPeer = ({ candidate }) => {
        console.log("Server wants to send ice candidates to peer.", candidate);
        // let message: NetworkMessages.IceCandidate = new NetworkMessages.IceCandidate("SERVER", this.remoteClientId, candidate);
        // this.sendMessage(message);
    };
    handleServerCommands = (_commandMessage) => {
        switch (_commandMessage.commandType) {
            case FudgeNetwork.SERVER_COMMAND_TYPE.DISCONNECT_CLIENT:
                this.disconnectClientByOwnCommand(_commandMessage);
                break;
            case FudgeNetwork.SERVER_COMMAND_TYPE.KEYS_INPUT:
                this.handleKeyInputFromClient(_commandMessage);
                break;
            default:
                console.log("No idea what message this is", _commandMessage);
                break;
        }
    };
    initiateConnectionByCreatingDataChannelAndCreatingOffer = (_clientToConnect) => {
        console.log("Initiating connection to : " + _clientToConnect);
        let newDataChannel = _clientToConnect.rtcPeerConnection.createDataChannel(_clientToConnect.id);
        _clientToConnect.rtcDataChannel = newDataChannel;
        newDataChannel.addEventListener("open", this.dataChannelStatusChangeHandler);
        // newDataChannel.addEventListener("close", this.dataChannelStatusChangeHandler);
        newDataChannel.addEventListener("message", this.dataChannelMessageHandler);
        _clientToConnect.rtcPeerConnection.createOffer()
            .then(async (offer) => {
            console.log("Beginning of createOffer in InitiateConnection, Expected 'stable', got:  ", _clientToConnect.rtcPeerConnection.signalingState);
            return offer;
        })
            .then(async (offer) => {
            await _clientToConnect.rtcPeerConnection.setLocalDescription(offer);
            console.log("Setting LocalDesc, Expected 'have-local-offer', got:  ", _clientToConnect.rtcPeerConnection.signalingState);
        })
            .then(() => {
            this.createOfferMessageAndSendToRemote(_clientToConnect);
        })
            .catch(() => {
            console.error("Offer creation error");
        });
    };
    createOfferMessageAndSendToRemote = (_clientToConnect) => {
        console.log("Sending offer now");
        const offerMessage = new FudgeNetwork.NetworkMessageRtcOffer("SERVER", _clientToConnect.id, _clientToConnect.rtcPeerConnection.localDescription);
        this.signalingServer.sendToId(_clientToConnect.id, offerMessage);
    };
    disconnectClientByOwnCommand = (_commandMessage) => {
        let clientToDisconnect = this.searchUserByUserIdAndReturnUser(_commandMessage.originatorId, this.authServerPeerConnectedClientCollection);
        clientToDisconnect.rtcDataChannel.close();
    };
    handleKeyInputFromClient = (_commandMessage) => {
        console.log(_commandMessage);
        let movingBox;
        this.divAndPlayerMap.forEach(playerDiv => {
            if (playerDiv[0] == _commandMessage.originatorId) {
                movingBox = playerDiv[1];
                switch (+_commandMessage.pressedKey) {
                    case 37:
                        if (movingBox.style.left != null) {
                            let previousLeft = parseInt(movingBox.style.left);
                            movingBox.style.left = previousLeft - this.movementSpeed + "px";
                        }
                        break;
                    case 38:
                        if (movingBox.style.top != null) {
                            let previousTop = parseInt(movingBox.style.top);
                            movingBox.style.top = previousTop - this.movementSpeed + "px";
                        }
                        break;
                    case 39:
                        if (movingBox.style.left != null) {
                            let previousLeft = parseInt(movingBox.style.left);
                            movingBox.style.left = previousLeft + this.movementSpeed + "px";
                        }
                        break;
                    case 40:
                        if (movingBox.style.top != null) {
                            let previousTop = parseInt(movingBox.style.top);
                            movingBox.style.top = previousTop + this.movementSpeed + "px";
                        }
                        break;
                }
                movingBox.textContent = _commandMessage.pressedKey + "";
            }
            else {
                console.error("Player has no div");
                movingBox = null;
            }
        });
    };
    // tslint:disable-next-line: no-any
    dataChannelStatusChangeHandler = (event) => {
        console.log("Server Datachannel opened");
    };
    addMovingDivForClient(_playerId) {
        let newPlayer = FudgeNetwork.UiElementHandler.addMovingDivForAuth();
        this.divAndPlayerMap.push([_playerId, newPlayer]);
    }
    dataChannelMessageHandler = (_message) => {
        console.log("Message received", _message);
        // tslint:disable-next-line: no-any
        let parsedMessage = JSON.parse(_message.data);
        switch (parsedMessage.messageType) {
            case FudgeNetwork.MESSAGE_TYPE.PEER_TO_SERVER_COMMAND:
                this.handleServerCommands(parsedMessage);
        }
    };
    // Helper function for searching through a collection, finding objects by key and value, returning
    // Object that has that value
    // tslint:disable-next-line: no-any
    searchForPropertyValueInCollection = (propertyValue, key, collectionToSearch) => {
        for (const propertyObject in collectionToSearch) {
            if (collectionToSearch.hasOwnProperty(propertyObject)) {
                // tslint:disable-next-line: typedef
                const objectToSearchThrough = collectionToSearch[propertyObject];
                if (objectToSearchThrough[key] === propertyValue) {
                    return objectToSearchThrough;
                }
            }
        }
        return null;
    };
    searchUserByUserNameAndReturnUser = (_userNameToSearchFor, _collectionToSearch) => {
        return this.searchForPropertyValueInCollection(_userNameToSearchFor, "userName", _collectionToSearch);
    };
    searchUserByUserIdAndReturnUser = (_userIdToSearchFor, _collectionToSearch) => {
        return this.searchForPropertyValueInCollection(_userIdToSearchFor, "id", _collectionToSearch);
    };
    searchUserByWebsocketConnectionAndReturnUser = (_websocketConnectionToSearchFor, _collectionToSearch) => {
        return this.searchForPropertyValueInCollection(_websocketConnectionToSearchFor, "clientConnection", _collectionToSearch);
    };
}
