
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star } from 'lucide-react';

const Counselors: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");

  const counselors = [
    { 
      id: 1, 
      name: 'Dr. Abdullah Malik', 
      specialty: 'Family Counseling', 
      rating: 5, 
      status: 'Online',
      favorite: true
    },
    { 
      id: 2, 
      name: 'Dr. Sara Ahmed', 
      specialty: 'Marriage Counseling', 
      rating: 5, 
      status: 'Online',
      favorite: false
    },
    { 
      id: 3, 
      name: 'Dr. Mohammed Hassan', 
      specialty: 'Youth Counseling', 
      rating: 4, 
      status: 'Offline',
      favorite: true
    },
    { 
      id: 4, 
      name: 'Dr. Nadia Fakih', 
      specialty: 'Family Counseling', 
      rating: 5, 
      status: 'Online',
      favorite: false
    },
    { 
      id: 5, 
      name: 'Dr. Yusuf Rahman', 
      specialty: 'Relationship Counseling', 
      rating: 4, 
      status: 'Offline',
      favorite: false
    }
  ];

  const filteredCounselors = activeTab === "favorite" 
    ? counselors.filter(c => c.favorite)
    : counselors;

  return (
    <SidebarLayout activePath="/counselors">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Counsellors</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search counsellors..."
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setActiveTab("all")}>All Counsellors</TabsTrigger>
          <TabsTrigger value="favorite" onClick={() => setActiveTab("favorite")}>Favorite</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 bg-primary/5 p-4 font-medium text-gray-700">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Name of Counsellor</div>
            <div className="col-span-3">Counsellor Info</div>
            <div className="col-span-2">Rating</div>
            <div className="col-span-3">Actions</div>
          </div>
          
          {filteredCounselors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No favorite counselors found.
            </div>
          ) : (
            filteredCounselors.map((counselor, index) => (
              <div key={counselor.id} className="grid grid-cols-12 p-4 border-b items-center">
                <div className="col-span-1">{index + 1}</div>
                <div className="col-span-3 flex items-center">
                  <div className="mr-3">
                    {counselor.favorite && <Star size={16} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div>
                    <div className="font-medium">{counselor.name}</div>
                    <div className="text-sm text-gray-500">{counselor.specialty}</div>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className={`inline-block px-2 py-1 rounded text-xs ${
                    counselor.status === 'Online' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {counselor.status}
                  </div>
                </div>
                <div className="col-span-2 flex">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < counselor.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} 
                    />
                  ))}
                </div>
                <div className="col-span-3 flex gap-2">
                  <Button size="sm" asChild>
                    <Link to={`/counselor/${counselor.id}`}>View Profile</Link>
                  </Button>
                  <Button size="sm" variant="outline">Book Session</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {filteredCounselors.length > 0 && (
        <div className="mt-6 flex justify-between">
          <Button variant="outline">Previous</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-primary text-white">1</Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0">2</Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0">3</Button>
          </div>
          <Button>Next</Button>
        </div>
      )}
    </SidebarLayout>
  );
};

export default Counselors;
