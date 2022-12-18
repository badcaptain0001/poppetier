const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://rishabh:Evlvrjg1@cluster0.owgjy.mongodb.net/medicodb?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const medicineSchema = new mongoose.Schema({
    medicineName: {type: String, default: null},
    medicineType: {type: String, default: null},
    medicineCompany: {type: String, default: null},
    medicinePrice: {type: String, default: null},
    medicineQuantity: {type: String, default: null},
    medicineImage: {type: Array, default: []},
    medicineLeaf: {type: String, default: null},
    medicineId: {type: String, default: null},
    dateOfRegistration: {type: String, default: null},
    dateOfUpdate: {type: String, default: null},
    medicineDescription: {type: String, default: null},
    rxRequired: {type: Boolean, default: false},
    disease: {type: String, default: null},
});

const Medicine = mongoose.model("Medicine", medicineSchema);


// update whole schema with verified status as false
Medicine.updateMany({}, { $set: { verified: false } }, function(err, result) {
    if (err) {
        console.log(err);
    } else {
        console.log(result);
    }
}
);
