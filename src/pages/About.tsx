import { Leaf, Users, Heart, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About FreshHarvest</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Delivering farm-fresh produce to your doorstep since 2025
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              FreshHarvest was born from a simple idea: everyone deserves access to fresh, healthy, and
              organic produce. We started as a small family business connecting local farmers with urban
              consumers, and we've grown into a trusted name in fresh produce delivery.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              We work directly with farmers across the country, ensuring they get fair prices for their
              harvest while you get the freshest produce at competitive rates. Every fruit and vegetable
              that reaches your home has been carefully selected and quality-checked by our team.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to make healthy eating accessible, convenient, and sustainable. We believe
              in supporting local agriculture, reducing food waste, and bringing communities together
              through the joy of fresh, wholesome food.
            </p>
          </div>
          <div>
            <img
              src="https://images.pexels.com/photos/1128678/pexels-photo-1128678.jpeg"
              alt="Fresh produce"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-20">
          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">100% Fresh</h3>
            <p className="text-gray-600">
              Direct from farms to ensure maximum freshness and nutrition
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">100+ Farmers</h3>
            <p className="text-gray-600">
              Supporting local farming communities across the country
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Happy Customers</h3>
            <p className="text-gray-600">
              Trusted by hundreds of families for their daily needs
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Farm Plucked</h3>
            <p className="text-gray-600">
              Freshly plucked from Patiala's Local Farms.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-6">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold mb-3">Quality First</h3>
              <p className="opacity-90">
                We never compromise on the quality of our produce. Every item is hand-picked and
                inspected to meet our high standards.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Sustainability</h3>
              <p className="opacity-90">
                We practice and promote sustainable farming methods that protect our environment for
                future generations.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Fair Trade</h3>
              <p className="opacity-90">
                We ensure fair compensation for farmers, helping them sustain their livelihoods and
                communities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
