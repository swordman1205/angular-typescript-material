import * as _ from "lodash";
import Media from "./mediaModel";
import ImageMock from "../../image/imageModel.mock";
import {IModelClass} from "../../abstractModel";
import {AbstractMock} from "../../abstractModel.mock";

export default class MediaMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Media;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            media: _.chain(1)
                .range(seededChance.integer({min: 1, max: 5}), 1)
                .map(():Object => {
                    let media = {
                        type: seededChance.pick(Media.mediaTypes),
                    };

                    switch (media.type) {
                        case Media.mediaTypeImage:
                            return _.merge(media, {
                                _image: ImageMock.entity(),
                                caption: seededChance.sentence(),
                            });
                        case Media.mediaTypeVideo:

                            let provider = seededChance.pick(Media.videoProviders);
                            return _.merge(media, {
                                provider: provider.providerKey,
                                videoId: provider.providerKey == Media.videoProviderVimeo ? chance.string({
                                    pool: '0123456789',
                                    length: 8
                                }) : chance.hash({length: 11}),
                            });
                    }

                })
                .value(),
            size: seededChance.pick(['small', 'half', 'full']),
            alignment: seededChance.pick(['left', 'right', 'centre']),
        };
    }

    public static entity(overrides:Object = {}, exists:boolean = true):Media {
        return <Media> new this().buildEntity(overrides, exists);
    }

}

