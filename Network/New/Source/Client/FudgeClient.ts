///<reference path="../Messages.ts"/>
namespace FudgeClient {
  export class FudgeClient {
    public signalingServerConnectionUrl: string | undefined = undefined;
    public localUserName: string;
    public localClientID: string;
    public webSocketConnectionToSignalingServer!: WebSocket;

    public ownPeerConnection!: RTCPeerConnection;
    public remoteClientId: string;
    public ownPeerDataChannel: RTCDataChannel | undefined;
    public remoteEventPeerDataChannel: RTCDataChannel | undefined;
    public isInitiator: boolean;
    // More info from here https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
    // tslint:disable-next-line: typedef
    readonly configuration = {
      iceServers: [
        { urls: "stun:stun2.1.google.com:19302" },
        { urls: "stun:stun.example.com" }
      ]
    };

    constructor() {
      this.localUserName = "";
      this.localClientID = "undefined";
      this.remoteClientId = "";
      this.isInitiator = false;
      this.remoteEventPeerDataChannel = undefined;
      // this.createRTCPeerConnectionAndAddEventListeners();
    }

    public connectToSignalingServer = (_uri: string = "ws://localhost:8080") => {
      try {
        this.signalingServerConnectionUrl = _uri;
        this.webSocketConnectionToSignalingServer = new WebSocket(_uri);
        this.addWebSocketEventListeners();
      } catch (error) {
        console.log("Websocket Generation gescheitert");
      }
    }
    public addWebSocketEventListeners = (): void => {
      try {
        this.webSocketConnectionToSignalingServer.addEventListener("open", (_connOpen: Event) => {
          console.log("Conneced to the signaling server", _connOpen);
        });

        this.webSocketConnectionToSignalingServer.addEventListener("error", (_err: Event) => {
          console.error(_err);
        });

        this.webSocketConnectionToSignalingServer.addEventListener("message", (_receivedMessage: MessageEvent) => {
          this.parseMessageAndHandleMessageType(_receivedMessage);
        });
      } catch (error) {
        console.error("Unexpected Error: Adding websocket Eventlistener", error);
      }
    }
    public parseMessageAndHandleMessageType = (_receivedMessage: MessageEvent) => {
      // tslint:disable-next-line: typedef
      let message = Messages.MessageBase.deserialize(_receivedMessage.data);

      switch (message.messageType) {
        case Messages.MESSAGE_TYPE.ID_ASSIGNED:
          console.log("ID received, assigning to self");
          this.assignIdAndSendConfirmation(<Messages.IdAssigned>message);
          break;

        case Messages.MESSAGE_TYPE.LOGIN_RESPONSE:
          this.loginValidAddUser(message.originatorId, (<Messages.LoginResponse>message).loginSuccess, (<Messages.LoginResponse>message).originatorUsername);
          break;

        case Messages.MESSAGE_TYPE.CLIENT_TO_SERVER_MESSAGE:
          console.log("BroadcastMessage received, requires further handling", _receivedMessage);
          break;

        case Messages.MESSAGE_TYPE.SERVER_TO_CLIENT_MESSAGE:
          this.displayServerMessage(_receivedMessage.data);
          break;

        // case Messages.MESSAGE_TYPE.RTC_OFFER:
        //   // console.log("Received offer, current signaling state: ", this.connection.signalingState);
        //   this.receiveNegotiationOfferAndSetRemoteDescription(objectifiedMessage);
        //   break;

        // case Messages.MESSAGE_TYPE.RTC_ANSWER:
        //   // console.log("Received answer, current signaling state: ", this.connection.signalingState);
        //   this.receiveAnswerAndSetRemoteDescription(objectifiedMessage.clientId, objectifiedMessage.answer);
        //   break;

        // case Messages.MESSAGE_TYPE.ICE_CANDIDATE:
        //   // console.log("Received candidate, current signaling state: ", this.connection.signalingState);
        //   this.addReceivedCandidateToPeerConnection(objectifiedMessage);
        //   break;
      }
    }



    //   public checkChosenUsernameAndCreateLoginRequest = (_loginName: string): void => {
    //     if (_loginName.length <= 0) {
    //       console.log("Please enter username");
    //       return;
    //     }
    //     this.createLoginRequestAndSendToServer(_loginName);
    //   }

    //   public checkUsernameToConnectToAndInitiateConnection = (_chosenUserNameToConnectTo: string): void => {
    //     if (_chosenUserNameToConnectTo.length === 0) {
    //       console.error("Enter a username 😉");
    //       return;
    //     }
    //     this.remoteClientId = _chosenUserNameToConnectTo;
    //     this.beginPeerConnectionNegotiation(this.remoteClientId);
    //   }
    //   public createRTCPeerConnectionAndAddEventListeners = () => {
    //     console.log("Creating RTC Connection");
    //     try {
    //       this.ownPeerConnection = new RTCPeerConnection(this.configuration);
    //       this.ownPeerConnection.addEventListener("icecandidate", this.sendIceCandidatesToPeer);
    //     } catch (error) { console.error("Unexpecte Error: Creating Client Peerconnection", error); }
    //   }


    //   public beginPeerConnectionNegotiation = (_userNameForOffer: string): void => {
    //     // Initiator is important for direct p2p connections
    //     this.isInitiator = true;
    //     try {
    //       this.ownPeerDataChannel = this.ownPeerConnection.createDataChannel("localDataChannel");
    //       this.ownPeerDataChannel.addEventListener("open", this.dataChannelStatusChangeHandler);
    //       this.ownPeerDataChannel.addEventListener("close", this.dataChannelStatusChangeHandler);
    //       this.ownPeerDataChannel.addEventListener("message", this.dataChannelMessageHandler);
    //       console.log("Senders", this.ownPeerConnection.getSenders());

    //     } catch (error) {
    //       console.error("Unexpected Error: Creating Client Datachannel and adding Listeners", error);
    //     }
    //     this.ownPeerConnection.createOffer()
    //       .then(async (offer) => {
    //         console.log("Beginning of createOffer in InitiateConnection, Expected 'stable', got:  ", this.ownPeerConnection.signalingState);
    //         return offer;
    //       })
    //       .then(async (offer) => {
    //         await this.ownPeerConnection.setLocalDescription(offer);
    //         console.log("Setting LocalDesc, Expected 'have-local-offer', got:  ", this.ownPeerConnection.signalingState);
    //       })
    //       .then(() => {
    //         this.createNegotiationOfferAndSendToPeer(_userNameForOffer);
    //       })
    //       .catch((error) => {
    //         console.error("Unexpected Error: Creating RTCOffer", error);
    //       });

    //   }
    //   public createNegotiationOfferAndSendToPeer = (_userNameForOffer: string) => {
    //     try {
    //       const offerMessage: FudgeNetwork.NetworkMessageRtcOffer = new FudgeNetwork.NetworkMessageRtcOffer(this.localClientID, _userNameForOffer, this.ownPeerConnection.localDescription);
    //       this.sendMessageToSignalingServer(offerMessage);
    //       console.log("Sent offer to remote peer, Expected 'have-local-offer', got:  ", this.ownPeerConnection.signalingState);
    //     } catch (error) {
    //       console.error("Unexpected Error: Creating Object and Sending RTC Offer", error);
    //     }
    //   }
    //   public receiveNegotiationOfferAndSetRemoteDescription = (_offerMessage: FudgeNetwork.NetworkMessageRtcOffer): void => {
    //     if (!this.ownPeerConnection) {
    //       console.error("Unexpected Error: OwnPeerConnection error");
    //       return;
    //     }
    //     this.ownPeerConnection.addEventListener("datachannel", this.receiveDataChannelAndEstablishConnection);
    //     this.remoteClientId = _offerMessage.originatorId;

    //     let offerToSet: RTCSessionDescription | RTCSessionDescriptionInit | null | undefined = _offerMessage.offer;
    //     if (!offerToSet) {
    //       return;
    //     }
    //     this.ownPeerConnection.setRemoteDescription(new RTCSessionDescription(offerToSet))
    //       .then(async () => {
    //         console.log("Received Offer and Set Descripton, Expected 'have-remote-offer', got:  ", this.ownPeerConnection.signalingState);
    //         await this.answerNegotiationOffer(_offerMessage.originatorId);
    //       })
    //       .catch((error) => {
    //         console.error("Unexpected Error: Setting Remote Description and Creating Answer", error);
    //       });
    //     console.log("End of Function Receive offer, Expected 'stable', got:  ", this.ownPeerConnection.signalingState);
    //   }




    //   public answerNegotiationOffer = (_remoteIdToAnswerTo: string) => {
    //     let ultimateAnswer: RTCSessionDescription;
    //     // Signaling example from here https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
    //     this.ownPeerConnection.createAnswer()
    //       .then(async (answer) => {
    //         console.log("Create Answer before setting local desc: Expected 'have-remote-offer', got:  ", this.ownPeerConnection.signalingState);
    //         ultimateAnswer = new RTCSessionDescription(answer);
    //         return await this.ownPeerConnection.setLocalDescription(ultimateAnswer);
    //       }).then(async () => {
    //         console.log("CreateAnswerFunction after setting local descp, Expected 'stable', got:  ", this.ownPeerConnection.signalingState);

    //         const answerMessage: FudgeNetwork.NetworkMessageRtcAnswer =
    //           new FudgeNetwork.NetworkMessageRtcAnswer(this.localClientID, _remoteIdToAnswerTo, "", ultimateAnswer);
    //         console.log("AnswerObject: ", answerMessage);
    //         await this.sendMessageToSignalingServer(answerMessage);
    //       })
    //       .catch((error) => {
    //         console.error("Unexpected error: Creating RTC Answer failed", error);
    //       });
    //   }
    //   public receiveAnswerAndSetRemoteDescription = (_localhostId: string, _answer: RTCSessionDescriptionInit) => {
    //     try {
    //       let descriptionAnswer: RTCSessionDescription = new RTCSessionDescription(_answer);
    //       this.ownPeerConnection.setRemoteDescription(descriptionAnswer);
    //     } catch (error) {
    //       console.error("Unexpected Error: Setting Remote Description from Answer", error);
    //     }
    //   }




    //   // tslint:disable-next-line: no-any
    //   public sendIceCandidatesToPeer = ({ candidate }: any) => {
    //     try {
    //       console.log("Sending ICECandidates from: ", this.localClientID);
    //       let message: FudgeNetwork.NetworkMessageIceCandidate = new FudgeNetwork.NetworkMessageIceCandidate(this.localClientID, this.remoteClientId, candidate);
    //       this.sendMessageToSignalingServer(message);
    //     } catch (error) {
    //       console.error("Unexpected Error: Creating and Sending ICECandidates to Peer", error);
    //     }
    //   }
    //   public addReceivedCandidateToPeerConnection = async (_receivedIceMessage: FudgeNetwork.NetworkMessageIceCandidate) => {
    //     if (_receivedIceMessage.candidate) {
    //       try {
    //         await this.ownPeerConnection.addIceCandidate(_receivedIceMessage.candidate);
    //       } catch (error) {
    //         console.error("Unexpected Error: Adding Ice Candidate", error);
    //       }
    //     }
    //   }




    //   public receiveDataChannelAndEstablishConnection = (_event: { channel: RTCDataChannel | undefined; }) => {
    //     this.remoteEventPeerDataChannel = _event.channel;
    //     if (this.remoteEventPeerDataChannel) {
    //       this.remoteEventPeerDataChannel.addEventListener("message", this.dataChannelMessageHandler);
    //       // this.remoteEventPeerDataChannel.addEventListener("open", this.enableKeyboardPressesForSending);
    //       this.remoteEventPeerDataChannel.addEventListener("close", this.dataChannelStatusChangeHandler);
    //     }
    //     else {
    //       console.error("Unexpected Error: RemoteDatachannel");
    //     }
    //   }


    // TODO: identical to pure WebSocket -> generalize
    public sendMessageToSignalingServer = (_message: Messages.MessageBase) => {
      let stringifiedMessage: string = _message.serialize();
      if (this.webSocketConnectionToSignalingServer.readyState == 1) {
        this.webSocketConnectionToSignalingServer.send(stringifiedMessage);
      }
      else {
        console.error("Websocket Connection closed unexpectedly");
      }
    }


    //   public sendMessageToServerViaDataChannel = (_messageToSend: string) => {
    //     try {
    //       if (this.remoteEventPeerDataChannel) {
    //         this.remoteEventPeerDataChannel.send(_messageToSend);
    //       }
    //     } catch (error) {
    //       console.error("Error occured when stringifying PeerMessage");
    //       console.error(error);
    //     }
    //   }


    //   public sendMessageToSingularPeer = (_messageToSend: string) => {
    //     let messageObject: FudgeNetwork.PeerMessageSimpleText = new FudgeNetwork.PeerMessageSimpleText(this.localClientID, _messageToSend, this.localUserName);

    //     let stringifiedMessage: string = this.stringifyObjectForNetworkSending(messageObject);
    //     console.log(stringifiedMessage);
    //     if (this.isInitiator && this.ownPeerDataChannel) {
    //       this.ownPeerDataChannel.send(stringifiedMessage);
    //     }
    //     else if (!this.isInitiator && this.remoteEventPeerDataChannel && this.remoteEventPeerDataChannel.readyState === "open") {
    //       console.log("Sending Message via received Datachannel");
    //       this.remoteEventPeerDataChannel.send(stringifiedMessage);
    //     }
    //     else {
    //       console.error("Datachannel: Connection unexpectedly lost");
    //     }
    //   }


    //   // TODO: see if this should send a custom event for further processing.
    //   public dataChannelMessageHandler = (_messageEvent: MessageEvent) => {
    //     if (_messageEvent) {
    //       // tslint:disable-next-line: no-any
    //       let parsedObject: FudgeNetwork.PeerMessageSimpleText = this.parseReceivedMessageAndReturnObject(_messageEvent);
    //       console.log(_messageEvent.type, parsedObject);
    //       // FudgeNetwork.UiElementHandler.chatbox.innerHTML += "\n" + parsedObject.originatorUserName + ": " + parsedObject.messageData;
    //       // FudgeNetwork.UiElementHandler.chatbox.scrollTop = FudgeNetwork.UiElementHandler.chatbox.scrollHeight;
    //       this.ownPeerConnection.dispatchEvent(new CustomEvent("receive", {detail: parsedObject}));
    //       this.remoteEventPeerDataChannel?.dispatchEvent(new CustomEvent("receive", {detail: parsedObject}));
    //     }
    //   }

    //   public getLocalClientId(): string {
    //     return this.localClientID;
    //   }

    //   public getLocalUserName(): string {
    //     return this.localUserName == "" || undefined ? "Kein Username vergeben" : this.localUserName;
    //   }
    private displayServerMessage(_messageToDisplay: Messages.MessageBase): void {
      // TODO: this must be handled by creator
      // let parsedObject: Messages.ToClient = this.parseReceivedMessageAndReturnObject(_messageToDisplay);
    }

    // private createLoginRequestAndSendToServer = (_requestingUsername: string) => {
    //   try {
    //     const loginMessage: Messages.LoginRequest = new Messages.LoginRequest(this.localClientID, _requestingUsername);
    //     this.sendMessageToSignalingServer(loginMessage);
    //   } catch (error) {
    //     console.error("Unexpected error: Sending Login Request", error);
    //   }
    // }
    private loginValidAddUser = (_assignedId: string, _loginSuccess: boolean, _originatorUserName: string): void => {
      if (_loginSuccess) {
        this.setOwnUserName(_originatorUserName);
        console.log("Local Username: " + this.localUserName);
      } else {
        console.log("Login failed, username taken");
      }
    }

    private assignIdAndSendConfirmation = (_message: Messages.IdAssigned) => {
      try {
        this.setOwnClientId(_message.assignedId);
        this.sendMessageToSignalingServer(new Messages.IdAssigned(this.localClientID));
      } catch (error) {
        console.error("Unexpected Error: Sending ID Confirmation", error);
      }
    }

    private stringifyObjectForNetworkSending = (_objectToStringify: Object): string => {
      let stringifiedObject: string = "";
      try {
        stringifiedObject = JSON.stringify(_objectToStringify);
      } catch (error) {
        console.error("JSON Parse failed", error);
      }
      return stringifiedObject;
    }


    private setOwnClientId(_id: string): void {
      this.localClientID = _id;
    }

    private setOwnUserName(_name: string): void {
      this.localUserName = _name;
    }


    //   private dataChannelStatusChangeHandler = (event: Event) => {
    //     //TODO Reconnection logic
    //     console.log("Channel Event happened", event);
  }
}
