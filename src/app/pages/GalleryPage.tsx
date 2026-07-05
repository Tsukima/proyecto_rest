import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import gastroteca1 from "../../imports/653710013_25970619505943501_3884838754510531791_n-1.jpg";
import gastroteca2 from "../../imports/654267329_25978894985115953_6773454436718274345_n-1.jpg";
import bistro1 from "../../imports/bistro-evento-mesa-larga.jpeg";
import bistro2 from "../../imports/bistro-mesa-ventanal.jpeg";
import terraza1 from "../../imports/terraza-gastrogarden-noche.jpeg";
import terraza2 from "../../imports/terraza-el-cafetin-noche.jpeg";

export function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Galería</h1>
          <p className="text-lg text-muted-foreground">
            Descubre nuestros espacios y ambiente
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">La Gastroteca</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {gastrotecaImages.map((image, index) => (
              <Card
                key={index}
                className="w-full sm:w-[360px] overflow-hidden group cursor-pointer focus-within:ring-2 focus-within:ring-primary"
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="relative aspect-[4/3] w-full overflow-hidden text-left"
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Ampliar ${image.alt}`}
                  >
                    <ImageWithFallback
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Bistro</h2>
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {bistroImages.map((image, index) => (
              <Card
                key={index}
                className="w-full sm:w-[360px] overflow-hidden group cursor-pointer focus-within:ring-2 focus-within:ring-primary"
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="relative aspect-[4/3] w-full overflow-hidden text-left"
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Ampliar ${image.alt}`}
                  >
                    <ImageWithFallback
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6 text-center">Terraza</h2>
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {terrazaImages.map((image, index) => (
              <Card
                key={index}
                className="w-full sm:w-[360px] overflow-hidden group cursor-pointer focus-within:ring-2 focus-within:ring-primary"
              >
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="relative aspect-[4/3] w-full overflow-hidden text-left"
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Ampliar ${image.alt}`}
                  >
                    <ImageWithFallback
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.alt}
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition hover:bg-white"
            onClick={() => setSelectedImage(null)}
            aria-label="Cerrar imagen ampliada"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="flex max-h-[92vh] max-w-[94vw] flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <ImageWithFallback
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-h-[86vh] max-w-full rounded-md object-contain shadow-2xl"
            />
            <p className="max-w-[90vw] rounded-full bg-white/90 px-4 py-2 text-center text-sm font-medium text-primary shadow">
              {selectedImage.alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

type GalleryImage = {
  src: string;
  alt: string;
};

const gastrotecaImages = [
  {
    src: gastroteca1,
    alt: "Barra de La Gastroteca - El Cafetín",
  },
  {
    src: gastroteca2,
    alt: "Interior de La Gastroteca - El Cafetín",
  },
];

const bistroImages = [
  {
    src: bistro1,
    alt: "Mesa preparada para evento en el Bistro - El Cafetín",
  },
  {
    src: bistro2,
    alt: "Mesa junto al ventanal del Bistro - El Cafetín",
  },
];

const terrazaImages = [
  {
    src: terraza1,
    alt: "Terraza GastroGarden de noche - El Cafetín",
  },
  {
    src: terraza2,
    alt: "Terraza exterior de noche - El Cafetín",
  },
];
