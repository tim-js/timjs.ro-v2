import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

export function cloudinaryImageUrl(cloudName, photo, width) {
  if (!cloudName) throw new Error("PUBLIC_CLOUDINARY_CLOUD_NAME is required.");
  const image = new Cloudinary({
    cloud: { cloudName },
    url: { secure: true, analytics: false },
  })
    .image(width ? photo.publicId : `${photo.publicId}.${photo.format}`)
    .setVersion(photo.version);

  if (width) {
    image
      .resize(
        fill()
          .width(width)
          .height(Math.round(width * 0.75))
          .gravity(autoGravity()),
      )
      .delivery(format("auto"))
      .delivery(quality("auto"));
  }
  return image.toURL();
}
