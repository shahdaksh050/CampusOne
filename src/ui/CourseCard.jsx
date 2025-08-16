import React from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { BookOpen, Clock, Users, Edit3, Trash2, Eye } from "lucide-react";

const CourseCard = ({ course, onEdit, onDelete, onView }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-400 hover:bg-gray-500">Inactive</Badge>;
      case "draft":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Draft</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-blue-700 hover:text-blue-800">{course.name}</h3>
            <p className="text-sm text-gray-600">{course.id}</p>
          </div>
          {getStatusBadge(course.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm">{course.instructor}</span>
            <span className="text-sm">{course.duration || `${course.credits} credits`}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>{course.students || 0} students enrolled</span>
          </div>
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 mb-3">{course.description || "No description available"}</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onView(course)}
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(course)}
                className="flex-1"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(course)}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
