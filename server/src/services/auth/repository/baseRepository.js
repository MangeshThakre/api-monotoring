// interface

class BaseRepository {
  constructor(modal) {
    this.modal = modal;
  }

  async create(data){
    throw new Error("method not implemented")
  }

  async findById(id){
    throw new Error("method not implemented")
  }

    async findByUserName(userName){
    throw new Error("method not implemented")
  }

   async findByEmail(Email){
    throw new Error("method not implemented")
  }

     async findAll(){
    throw new Error("method not implemented")
  }
}

export default BaseRepository;
