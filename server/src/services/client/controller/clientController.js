export default class ClientController {
  constructor(ClientService) {
    if (!ClientService) throw new Error("clientService Required");
    this.ClientController = ClientController;
  }
}
