import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ChevronRight, Star, Leaf, Award, Users } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import barImg from "../../imports/653710013_25970619505943501_3884838754510531791_n-1.jpg";
import gastrotecaImg from "../../imports/654267329_25978894985115953_6773454436718274345_n-1.jpg";
import bistroEventImg from "../../imports/bistro-evento-mesa-larga.jpeg";
import bistroWindowImg from "../../imports/bistro-mesa-ventanal.jpeg";
import terraceGardenImg from "../../imports/terraza-gastrogarden-noche.jpeg";
import terraceNightImg from "../../imports/terraza-el-cafetin-noche.jpeg";
import homeCarousel1 from "../../imports/home-carousel-bistro-detalle-1.jpeg";
import homeCarousel2 from "../../imports/home-carousel-bistro-detalle-2.jpeg";
import homeCarousel3 from "../../imports/home-carousel-bistro-detalle-3.jpeg";
import homeCarousel4 from "../../imports/home-carousel-bistro-detalle-4.jpeg";
import pulpoImg from "../../imports/comisqueros-ensalada-de-pulpo-marinado-portada-1024x1024.jpg";
import tartarImg from "../../imports/How-to-Make-Steak-Tartare.jpg";
import croquetasImg from "../../imports/croquetas-caseras-de-jamon.jpg";
import tatakiImg from "../../imports/images.jpg";
import embutidosImg from "../../imports/tabla-de-embutidos.jpg";

const heroImages = [
  { src: bistroWindowImg, alt: "Mesa preparada junto al ventanal del Bistro" },
  { src: bistroEventImg, alt: "Mesa larga preparada para evento en el Bistro" },
  { src: homeCarousel1, alt: "Detalle de mesa preparada en el Bistro" },
  { src: homeCarousel2, alt: "Comedor del Bistro preparado para servicio" },
  { src: homeCarousel3, alt: "Mesa del Bistro con montaje de copas" },
  { src: homeCarousel4, alt: "Mesa larga del Bistro con vajilla preparada" },
  { src: terraceGardenImg, alt: "Terraza GastroGarden de noche" },
  { src: terraceNightImg, alt: "Terraza exterior de El Cafetín de noche" },
  { src: barImg, alt: "Interior de La Gastroteca" },
  { src: gastrotecaImg, alt: "Ambiente de La Gastroteca" },
];

export function HomePage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const currentDay = new Date().getDay();
  const isSaturday = currentDay === 6;
  const isWeekday = currentDay >= 1 && currentDay <= 5;
  const showWeekdayMenu = isWeekday;
  const showWeekendMenu = isSaturday;
  const nextHeroImage = () => {
    setHeroIndex((current) => (current + 1) % heroImages.length);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      nextHeroImage();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <section className="relative flex min-h-[500px] h-[calc(100vh-4rem)] max-h-[640px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        {heroImages.map((image, index) => (
          <ImageWithFallback
            key={image.src}
            src={image.src}
            alt={image.alt}
            className={[
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
              index === heroIndex ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        ))}
        <div className="relative z-20 mx-auto max-w-[min(980px,calc(100vw-3rem))] px-4 text-center">
          <h1 className="mb-5 text-[clamp(2.5rem,5.2vw,5rem)] font-bold leading-[1.04] text-white">
            Bienvenido a El Cafetin
          </h1>
          <p className="mb-8 text-[clamp(1.15rem,2vw,1.8rem)] text-white/90">
            Tu gastrobar en el corazón de Pontevedra
          </p>
        </div>
        <button
          type="button"
          aria-label="Cambiar imagen"
          onClick={nextHeroImage}
          className="absolute right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-black/30 text-white shadow-lg backdrop-blur transition hover:bg-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver imagen ${index + 1}`}
              onClick={() => setHeroIndex(index)}
              className={[
                "h-2.5 rounded-full transition-all",
                index === heroIndex ? "w-8 bg-white" : "w-2.5 bg-white/55 hover:bg-white/80",
              ].join(" ")}
            />
          ))}
        </div>
      </section>

      <section className="py-[var(--page-section-y)]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[var(--page-section-gap)]">
            <h2 className="text-[length:var(--page-title-size)] font-bold mb-4">Oferta Gastronómica</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre el menú disponible para el día de hoy
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {showWeekdayMenu && <Card className="bg-gradient-to-br from-[#fff3d8] via-[#f8fff2] to-[#cfe9c3] border-primary/40 hover:shadow-xl transition-shadow h-full">
              <CardHeader className="text-center">
                <CardTitle className="text-[length:var(--page-card-title-size)] mb-4 text-primary">🍽️ Menú del Día</CardTitle>
                <p className="text-lg font-medium text-foreground/80">Lunes a Viernes</p>
                <p className="text-4xl font-bold text-primary mt-4">18,00 €</p>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Menús que cambian diariamente con ingredientes de temporada
                </p>
                <p className="text-sm italic">
                  Incluye: Bebida, postre o café
                </p>
                <div className="flex justify-center pt-2">
                  <Link to="/menu-dia">
                    <Button variant="outline" className="w-full border-primary/35 text-primary hover:bg-primary hover:text-primary-foreground">
                      Ver Menú
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>}

            {showWeekendMenu && <Card className="bg-gradient-to-br from-[#dcefd2] via-[#fffaf0] to-[#f2ddb7] border-primary/40 hover:shadow-xl transition-shadow h-full">
              <CardHeader className="text-center">
                <CardTitle className="text-[length:var(--page-card-title-size)] mb-4 text-primary">🍷 Menú Fin de Semana</CardTitle>
                <p className="text-lg font-medium text-foreground/80">Sábado</p>
                <p className="text-4xl font-bold text-primary mt-4">28,00 €</p>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Menús especiales con ingredientes premium
                </p>
                <p className="text-sm italic">
                  Incluye: Bebida, postre o café
                </p>
                <div className="flex justify-center pt-2">
                  <Link to="/menu-fin-de-semana">
                    <Button variant="outline" className="w-full border-primary/35 text-primary hover:bg-primary hover:text-primary-foreground">
                      Ver Menú
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>}
            <Card className="bg-gradient-to-br from-[#f6ead6] via-[#fffaf0] to-[#dcefd2] border-primary/40 hover:shadow-xl transition-shadow h-full">
              <CardHeader className="text-center">
                <CardTitle className="text-[length:var(--page-card-title-size)] mb-4 text-primary">📖 Carta</CardTitle>
                <p className="text-lg font-medium text-foreground/80">Disponible toda la semana</p>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Consulta nuestros platos, bebidas y propuestas de la casa
                </p>
                <p className="text-sm italic">
                  Cocina, cafetería, vinos y bebidas
                </p>
                <div className="flex justify-center pt-2">
                  <Link to="/menu">
                    <Button variant="outline" className="w-full border-primary/35 text-primary hover:bg-primary hover:text-primary-foreground">
                      Ver Carta
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            {!showWeekdayMenu && !showWeekendMenu && (
              <Card className="bg-muted/40 border-primary/20">
                <CardContent className="text-center py-10">
                  <h3 className="text-2xl font-bold text-primary mb-2">Menús disponibles próximamente</h3>
                  <p className="text-muted-foreground">
                    El Menú del Día se muestra de lunes a viernes y el Menú Fin de Semana solo los sábados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="py-[var(--page-section-y)] bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-[var(--page-section-gap)] items-center">
            <div>
              <h2 className="text-[length:var(--page-title-size)] font-bold mb-6">Sobre Nosotros</h2>
              <p className="text-lg text-muted-foreground mb-4">
                En El Cafetín de Pontevedra te ofrecemos una experiencia gastronómica
                única con un toque náutico especial. Nuestro espacio combina la calidez
                de un cafetín tradicional con la modernidad de un gastrobar contemporáneo.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Abiertos de lunes a sábado en <strong>La Cafetería</strong>, con servicio de cocina en
                <strong> El Bistro</strong> al mediodía y <strong>La Gastroteca</strong> de jueves a sábado por la noche.
                Productos frescos, tapas elaboradas y un ambiente acogedor en el corazón de Pontevedra.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-bold text-2xl">Calidad</p>
                  <p className="text-sm text-muted-foreground">Productos frescos</p>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-bold text-2xl">Ambiente</p>
                  <p className="text-sm text-muted-foreground">Acogedor</p>
                </div>
                <div className="text-center">
                  <Leaf className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-bold text-2xl">Galicia</p>
                  <p className="text-sm text-muted-foreground">Producto local</p>
                </div>
              </div>
            </div>
            <div className="relative h-[clamp(320px,42vw,500px)]">
              <ImageWithFallback
                src={barImg}
                alt="Barra de El Cafetin"
                className="w-full h-full object-cover rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="py-[var(--page-section-y)]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-[var(--page-section-gap)]">
            <h2 className="text-[length:var(--page-title-size)] font-bold mb-4">Nuestra Carta</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Platos elaborados con productos frescos y de calidad
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-64">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2">{item.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <span className="text-2xl font-bold text-primary">{item.price}€</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/menu">
              <Button size="lg" variant="outline">
                Ver Carta Completa
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-10 max-w-4xl rounded-lg border border-primary/15 bg-[#f8f3e8] p-6 shadow-sm">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Área de clientes
                </p>
                <h3 className="mt-2 text-2xl font-bold text-[#1f3d2a]">
                  Regístrate y gestiona mejor tus reservas
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Accede a tus reservas activas, consulta tu historial y localiza tus datos de contacto más rápido al reservar.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#304838]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    Reservas en tu perfil
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    Atención más rápida
                  </span>
                </div>
              </div>
              <Link to="/register" className="md:justify-self-end">
                <Button size="lg" className="w-full md:w-auto">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Opiniones</h2>
            <p className="text-lg text-muted-foreground">
              Lo que dicen nuestros clientes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.comment}"
                  </p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

const menuItems = [
  {
    name: "Pulpo en carpaccio estilo feria",
    description: "Pulpo tierno en finas láminas",
    price: "18.00",
    image: pulpoImg,
  },
  {
    name: "Steak tartar de vaca",
    description: "Carne de vaca picada, huevo, mostaza y especias",
    price: "19.00",
    image: tartarImg,
  },
  {
    name: "Pizarra embutido ibérico estirpe negra",
    description: "Selección de embutidos ibéricos premium",
    price: "16.50",
    image: embutidosImg,
  },
  {
    name: "Croquetas caseras de jamón ibérico",
    description: "8 unidades de croquetas cremosas",
    price: "12.00",
    image: croquetasImg,
  },
  {
    name: "Tataki de atún, guacamole y teriyaki",
    description: "Atún sellado con guacamole cremoso y salsa teriyaki",
    price: "19.00",
    image: tatakiImg,
  },
  {
    name: "Coulant de chocolate belga y helado",
    description: "Bizcocho de chocolate con corazón fundido",
    price: "7.00",
    image: "https://images.unsplash.com/photo-1673551490812-eaee2e9bf0ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjaG9jb2xhdGUlMjBsYXZhJTIwY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzgwODY5MDczfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const testimonials = [
  {
    name: "María González",
    comment: "El menú del día está muy bien planteado: platos caseros, producto fresco y raciones perfectas para comer bien sin complicarse.",
    date: "Mayo 2026",
  },
  {
    name: "Carlos Martínez",
    comment: "Probamos el steak tartar y las croquetas de jamón ibérico de la carta. Todo llegó muy cuidado y con muchísimo sabor.",
    date: "Abril 2026",
  },
  {
    name: "Ana López",
    comment: "Me gusta que siempre haya opciones variadas entre la carta y el menú del día. Es de esos sitios donde sabes que vas a acertar.",
    date: "Junio 2026",
  },
];
