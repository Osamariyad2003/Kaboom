export default function Features() {
  const features = [
    {
      title: 'Theoretical Background',
      image: 'https://i.imgur.com/uUIRSCE.jpeg',
    },
    {
      title: 'Visualisation & Simulation Tool',
      image: 'https://images.pexels.com/photos/73873/star-clusters-rosette-nebula-star-galaxies-73873.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      title: 'Impact Consequences',
      image: 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  return (
    <section className="bg-neutral-700 flex justify-center gap-16 px-5 py-12 text-center text-white">
      {features.map((feature, index) => (
        <div key={index} className="max-w-[200px]">
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-5 transition-transform hover:scale-110">
            <img
              src={feature.image}
              alt={feature.title}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-base">{feature.title}</p>
        </div>
      ))}
    </section>
  );
}
