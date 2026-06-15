import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/layout/Footer";
import { useListCategories } from "@workspace/api-client-react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 26 },
  },
};

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <section className="pt-14 pb-10 border-b border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium mb-3">Browse</p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Shop by Category
              </h1>
              <p className="mt-3 text-muted-foreground text-base max-w-md">
                Explore our full collection, sorted by category. Find exactly what you're looking for.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {(categories ?? []).map((cat) => (
                  <motion.div key={cat.id} variants={cardVariants}>
                    <Link href={`/products?category=${cat.slug}`}>
                      <motion.div
                        whileHover={{ y: -6 }}
                        transition={{ type: "spring", stiffness: 350, damping: 26 }}
                        className="group relative rounded-2xl overflow-hidden cursor-pointer bg-muted/40 h-64"
                      >
                        {cat.imageUrl ? (
                          <motion.img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            whileHover={{ scale: 1.07 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10" />
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                {cat.productCount} products
                              </p>
                              <h2 className="text-white text-2xl font-bold tracking-tight">
                                {cat.name}
                              </h2>
                            </div>
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              whileHover={{ opacity: 1, x: 0 }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                <ArrowRight className="h-4 w-4 text-white" />
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
