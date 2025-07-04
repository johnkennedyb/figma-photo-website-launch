import React, { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Clock, MessageCircle, Search, Filter } from 'lucide-react';
import { useCounselors } from '@/hooks/useData';
import { useNavigate } from 'react-router-dom';

const Counselors: React.FC = () => {
  const { counselors, loading } = useCounselors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const navigate = useNavigate();

  const filteredCounselors = counselors.filter(counselor => {
    const matchesSearch = `${counselor.profiles.first_name} ${counselor.profiles.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesSpecialization = !selectedSpecialization || 
      counselor.specializations?.includes(selectedSpecialization);
    
    return matchesSearch && matchesSpecialization;
  });

  const allSpecializations = [...new Set(counselors.flatMap(c => c.specializations || []))];

  if (loading) {
    return (
      <SidebarLayout activePath="/counselors">
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="/counselors">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Find Counsellors</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search counselors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Specializations</option>
              {allSpecializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredCounselors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCounselors.map((counselor) => (
              <div key={counselor.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 font-semibold">
                      {counselor.profiles.first_name?.[0]}{counselor.profiles.last_name?.[0]}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">
                      {counselor.profiles.first_name} {counselor.profiles.last_name}
                    </h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {counselor.rating?.toFixed(1) || '5.0'} ({counselor.total_sessions || 0} sessions)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{counselor.experience_years}+ years experience</span>
                  </div>
                  {counselor.hourly_rate && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">${counselor.hourly_rate}/hour</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {counselor.bio || 'Experienced counselor providing guidance and support.'}
                </p>
                
                {counselor.specializations && counselor.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {counselor.specializations.slice(0, 3).map((spec, index) => (
                      <Badge key={index} variant="secondary">{spec}</Badge>
                    ))}
                    {counselor.specializations.length > 3 && (
                      <Badge variant="outline">+{counselor.specializations.length - 3} more</Badge>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(`/counselor/${counselor.id}`)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/counselor/${counselor.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No counselors found</h3>
              <p>Try adjusting your search criteria or browse all counselors.</p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Counselors;