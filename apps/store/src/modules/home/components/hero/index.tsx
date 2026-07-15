import { Heading } from "@modules/common/components/ui";
import LocalizedClientLink from "@modules/common/components/localized-client-link";

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-grey-20 relative bg-gradient-to-b from-primary/5 to-white">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading level="h1" className="text-3xl small:text-5xl leading-tight text-primary">
            Modern Ayurvedic Essentials
          </Heading>
          <Heading level="h2" className="mt-3 text-xl small:text-2xl leading-snug text-brandneutral font-medium">
            Products recommended for your unique constitution
          </Heading>
        </span>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
        >
          Shop All Products
        </LocalizedClientLink>
      </div>
    </div>
  );
};

export default Hero;
