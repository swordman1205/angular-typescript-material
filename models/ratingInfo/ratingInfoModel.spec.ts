import {expect} from "../../../testBootstrap.spec";
import RatingInfo from "./ratingInfoModel";
describe('Rating Info Model', () => {

    it('should instantiate a new rating info', () => {

        let ratingInfo = new RatingInfo({});

        expect(ratingInfo).to.be.instanceOf(RatingInfo);

    });

    it('should have a default rounded rating value', () => {

        let ratingInfo = new RatingInfo({averageRating: 3.2});

        expect(ratingInfo.__roundedRating).to.equal(3.0);

    });

    it('should be able to get custom rating roundings', () => {

        let ratingInfo = new RatingInfo({averageRating: 3.261});

        expect(ratingInfo.getRounded(0.5)).to.equal(3.5);
        expect(ratingInfo.getRounded(1)).to.equal(3.0);
        expect(ratingInfo.getRounded(0.1)).to.equal(3.3);
        expect(ratingInfo.getRounded(0.01)).to.equal(3.26);

    });

});


